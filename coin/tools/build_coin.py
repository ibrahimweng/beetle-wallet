"""Build a coin in Blender: the mesh, its glaze, the baked textures, the GLB,
and renders to look at.

Runs on Blender's Python module (pip install bpy), with no Blender window:

    python build_coin.py                  # the coin with the hole
    python build_coin.py --variant logo   # the coin without the hole, the logo pressed in
    python build_coin.py --shape-only     # quick grey renders to check the shape
    python build_coin.py --previews-only  # stills again, from the textures already baked

Writes ../coin-<variant>.glb, ../textures/coin-<variant>_*.{jpg,png} (what the
GLB carries) and ../previews/*.png.
"""
import argparse
import math
import os
import sys

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import coin_geometry as geo  # noqa: E402

RADIUS_M = 0.02  # a 40 mm coin; glTF is in metres


# ------------------------------------------------------------------ scene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    return scene


def make_coin(mesh, name="Coin"):
    v = mesh["verts"]
    # Stand it up facing the viewer: glTF's front is +Z with +Y up, which is
    # Blender's -Y with +Z up.
    v = np.c_[v[:, 0], -v[:, 2], v[:, 1]] * RADIUS_M
    loops, sizes = mesh["loops"], mesh["sizes"]
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(v))
    me.vertices.foreach_set("co", v.astype(np.float32).ravel())
    me.loops.add(len(loops))
    me.loops.foreach_set("vertex_index", loops.astype(np.int32))
    me.polygons.add(len(sizes))
    me.polygons.foreach_set("loop_start", np.r_[0, np.cumsum(sizes)[:-1]].astype(np.int32))
    me.update(calc_edges=True)
    me.validate()
    layer = me.uv_layers.new(name="UVMap")
    layer.data.foreach_set("uv", mesh["uv"].astype(np.float32).ravel())
    for key, values in mesh["attrs"].items():  # for the glaze; not exported
        me.attributes.new(key, "FLOAT", "POINT").data.foreach_set("value", values.astype(np.float32))
    me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ------------------------------------------------------------------ lights and cameras


def studio(scene, look="dark"):
    """Product-shot lighting. "dark" is a black room with softboxes, like the
    front photo; "tent" is a white light tent, like the angled one."""
    for ob in [o for o in scene.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(ob)
    world = bpy.data.worlds.new("Studio " + look)
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes["Background"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    low, high = ((0.004, 0.012) if look == "dark" else (0.10, 0.85))
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = (low, low, low, 1)
    ramp.color_ramp.elements[1].position = 0.80
    ramp.color_ramp.elements[1].color = (high, high, high * 1.02, 1)
    mapr = nt.nodes.new("ShaderNodeMapRange")
    mapr.inputs["From Min"].default_value = -1
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mapr.inputs["Value"])
    nt.links.new(mapr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])

    def area(name, loc, size, energy):
        light = bpy.data.lights.new(name, "AREA")
        light.shape = "RECTANGLE"
        light.size, light.size_y = size
        light.energy = energy
        ob = bpy.data.objects.new(name, light)
        ob.location = loc
        scene.collection.objects.link(ob)
        ob.rotation_euler = _look_rotation(-np.array(loc, float))
        return ob

    if look == "dark":
        area("Key", (-0.16, -0.22, 0.24), (0.30, 0.22), 9.0)
        area("Strip", (0.30, -0.10, -0.10), (0.06, 0.40), 3.5)
        area("Fill", (0.05, -0.35, -0.12), (0.30, 0.10), 1.2)
    else:
        area("Key", (-0.10, -0.25, 0.25), (0.40, 0.40), 6.0)


def _look_rotation(direction):
    from mathutils import Vector

    return Vector(direction).to_track_quat("-Z", "Y").to_euler()


def camera_front(scene, photo_w, photo_h, circle):
    """An orthographic camera framed exactly like reference/front.png."""
    cx, cy, r_px = circle
    cam = bpy.data.cameras.new("Front")
    cam.type = "ORTHO"
    m = max(photo_w, photo_h)
    cam.ortho_scale = m / r_px * RADIUS_M
    cam.shift_x = (photo_w / 2 - cx) / m
    cam.shift_y = (cy - photo_h / 2) / m
    ob = bpy.data.objects.new("Front", cam)
    ob.location = (0, -1.0, 0)
    ob.rotation_euler = (math.pi / 2, 0, 0)
    scene.collection.objects.link(ob)
    return ob


def camera_fit(scene, photo_w, photo_h, x):
    """The pinhole camera fit_thickness.py found for reference/angle.png."""
    from mathutils import Matrix

    yaw, pitch, roll, dist, scale, cx, cy = x[:7]
    sys.path.insert(0, HERE)
    from fit_thickness import rot

    r = rot(yaw, pitch, roll)
    to_world = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]])  # coin frame -> Blender (as make_coin)
    cam_in_coin = r.T  # columns: camera axes in the coin frame
    m = np.eye(4)
    m[:3, :3] = to_world @ cam_in_coin
    m[:3, 3] = to_world @ (r.T @ np.array([0, 0, dist])) * RADIUS_M
    cam = bpy.data.cameras.new("Angle")
    cam.sensor_fit = "HORIZONTAL"
    cam.sensor_width = 36.0
    cam.lens = scale * dist * 36.0 / photo_w
    big = max(photo_w, photo_h)
    cam.shift_x = (photo_w / 2 - cx) / big
    cam.shift_y = (cy - photo_h / 2) / big
    ob = bpy.data.objects.new("Angle", cam)
    ob.matrix_world = Matrix(m.tolist())
    scene.collection.objects.link(ob)
    return ob


def render(scene, cam, size, path, samples=64, transparent=True):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ------------------------------------------------------------------ materials


class Graph:
    """A little help wiring shader nodes."""

    def __init__(self, tree):
        self.tree = tree

    def node(self, kind, inputs=None, **props):
        n = self.tree.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        for k, v in (inputs or {}).items():
            self.set(n.inputs[k], v)
        return n

    def set(self, socket, value):
        if isinstance(value, bpy.types.NodeSocket):
            self.tree.links.new(value, socket)
        elif isinstance(value, bpy.types.Node):
            self.tree.links.new(next(o for o in value.outputs if o.enabled), socket)
        else:
            socket.default_value = value

    def out(self, value):
        if isinstance(value, bpy.types.Node):
            return next(o for o in value.outputs if o.enabled)
        return value

    def math(self, op, a, b=0.0, clamp=False):
        n = self.node("ShaderNodeMath", operation=op, use_clamp=clamp)
        self.set(n.inputs[0], self.out(a) if not isinstance(a, float) else a)
        self.set(n.inputs[1], self.out(b) if not isinstance(b, float) else b)
        return n.outputs[0]

    def mix(self, fac, a, b, kind="RGBA"):
        n = self.node("ShaderNodeMix", data_type=kind)
        ins = [i for i in n.inputs if i.enabled]
        for sock, v in zip(ins, (fac, a, b)):
            self.set(sock, self.out(v) if isinstance(v, (bpy.types.Node, bpy.types.NodeSocket)) else v)
        return next(o for o in n.outputs if o.enabled)

    def map_range(self, v, a, b, c=0.0, d=1.0, smooth=False):
        n = self.node("ShaderNodeMapRange", interpolation_type="SMOOTHSTEP" if smooth else "LINEAR")
        self.set(n.inputs["Value"], self.out(v))
        n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
        n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = c, d
        return n.outputs["Result"]

    def noise(self, p, scale, detail=2.0, roughness=0.5, distortion=0.0, offset=(0, 0, 0)):
        if any(offset):
            v = self.node("ShaderNodeVectorMath", operation="ADD")
            self.set(v.inputs[0], p)
            v.inputs[1].default_value = offset
            p = v.outputs[0]
        n = self.node("ShaderNodeTexNoise", {"Scale": scale, "Detail": detail, "Roughness": roughness, "Distortion": distortion})
        self.set(n.inputs["Vector"], p)
        return n.outputs["Fac"]


def srgb(r, g, b):
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(r), lin(g), lin(b), 1.0)


# The glaze, read off the photographs: a near-black brown body under a lustre
# that runs bronze, plum, blue and teal in soft patches, with pinholes and the
# odd pale fleck.
BODY = srgb(36, 25, 20)
LUSTRE = [
    (0.00, srgb(96, 66, 44)),  # bronze
    (0.22, srgb(100, 62, 46)),  # copper
    (0.40, srgb(80, 56, 74)),  # plum
    (0.52, srgb(62, 62, 92)),  # blue
    (0.63, srgb(54, 76, 78)),  # teal
    (0.78, srgb(92, 80, 50)),  # brass
    (1.00, srgb(96, 66, 44)),  # bronze again
]
SPECK_DARK = srgb(10, 8, 7)
SPECK_LIGHT = srgb(120, 110, 95)
# Where a stamp has pressed the clay in, the glaze runs into it and lies
# thicker: darker and glossier. On the edge above, it runs thin and breaks
# lighter.
POOLED = srgb(22, 15, 12)
BROKEN = srgb(132, 96, 64)


def glaze_channels(g, pooled=False):
    """Build the procedural glaze. Returns sockets for colour, metallic,
    roughness and the height used for the normal map. With `pooled`, the mesh's
    `pool` and `brk` attributes say where the glaze lies thick and thin."""
    tc = g.node("ShaderNodeTexCoord")
    p = g.node("ShaderNodeVectorMath", operation="SCALE")
    g.set(p.inputs[0], tc.outputs["Object"])
    p.inputs["Scale"].default_value = 1.0 / RADIUS_M  # work in coin radii
    p = p.outputs[0]

    hue = g.map_range(g.noise(p, 2.2, detail=4.0, roughness=0.55, distortion=0.8), 0.28, 0.72)
    ramp = g.node("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = LUSTRE[0]
    els[1].position, els[1].color = LUSTRE[-1]
    for pos, col in LUSTRE[1:-1]:
        e = els.new(pos)
        e.color = col
    g.set(ramp.inputs["Fac"], hue)
    lustre = ramp.outputs["Color"]

    strength = g.map_range(g.noise(p, 1.6, detail=2.0, offset=(13.1, 7.7, 3.3)), 0.32, 0.68, 0.35, 1.0, smooth=True)
    grain = g.map_range(g.noise(p, 14.0, detail=3.0, roughness=0.6, offset=(3.0, 8.0, 1.0)), 0.3, 0.7, 0.75, 1.0)
    colour = g.mix(g.math("MULTIPLY", strength, grain), BODY, lustre)

    def specks(scale, pick, size, offset):
        v = g.node("ShaderNodeTexVoronoi", {"Scale": scale, "Randomness": 1.0})
        q = g.node("ShaderNodeVectorMath", operation="ADD")
        g.set(q.inputs[0], p)
        q.inputs[1].default_value = offset
        g.set(v.inputs["Vector"], q.outputs[0])
        sep = g.node("ShaderNodeSeparateColor")
        g.set(sep.inputs[0], v.outputs["Color"])
        chosen = g.math("LESS_THAN", sep.outputs[0], pick)
        dot = g.map_range(v.outputs["Distance"], size * 0.55, size, 1.0, 0.0, smooth=True)
        return g.math("MULTIPLY", dot, chosen)

    dark = specks(90.0, 0.14, 0.15, (0.0, 0.0, 0.0))
    light = specks(55.0, 0.012, 0.12, (5.3, 2.1, 9.4))
    colour = g.mix(dark, colour, SPECK_DARK)
    colour = g.mix(light, colour, SPECK_LIGHT)

    plain = g.math("MULTIPLY", g.math("SUBTRACT", 1.0, dark), g.math("SUBTRACT", 1.0, light))
    metallic = g.math("ADD", 0.05, g.math("MULTIPLY", plain, 0.80))
    rough = g.math("ADD", 0.15, g.math("MULTIPLY", g.noise(p, 3.5, offset=(2.0, 4.0, 6.0)), 0.10))
    rough = g.math("ADD", rough, g.math("MULTIPLY", g.math("SUBTRACT", 1.0, plain), 0.40), clamp=True)

    if pooled:
        pool = g.node("ShaderNodeAttribute", attribute_name="pool", attribute_type="GEOMETRY").outputs["Fac"]
        brk = g.node("ShaderNodeAttribute", attribute_name="brk", attribute_type="GEOMETRY").outputs["Fac"]
        colour = g.mix(g.math("MULTIPLY", pool, 0.55), colour, POOLED)
        colour = g.mix(g.math("MULTIPLY", brk, 0.30), colour, BROKEN)
        rough = g.math("SUBTRACT", rough, g.math("MULTIPLY", pool, 0.05), clamp=True)

    # Height in coin radii: the glaze's slow waves, its orange peel, and pinholes.
    wave = g.math("MULTIPLY", g.math("SUBTRACT", g.noise(p, 2.2, detail=2.0, offset=(9.0, 1.0, 4.0)), 0.5), 0.0035)
    peel = g.math("MULTIPLY", g.math("SUBTRACT", g.noise(p, 34.0, detail=3.0, roughness=0.45), 0.5), 0.0007)
    pits = g.math("MULTIPLY", dark, -0.0025)
    height = g.math("ADD", g.math("ADD", wave, peel), pits)
    return colour, metallic, rough, height


def glaze_material(name="Glazed clay", pooled=False):
    """The procedural glaze, live, for baking from."""
    mat = bpy.data.materials.new(name + " (procedural)")
    mat.use_nodes = True
    nt = mat.node_tree
    g = Graph(nt)
    bsdf = nt.nodes["Principled BSDF"]
    out = nt.nodes["Material Output"]
    colour, metallic, rough, height = glaze_channels(g, pooled)
    g.set(bsdf.inputs["Base Color"], colour)
    g.set(bsdf.inputs["Metallic"], metallic)
    g.set(bsdf.inputs["Roughness"], rough)
    bump = g.node("ShaderNodeBump", {"Strength": 1.0, "Distance": RADIUS_M})
    g.set(bump.inputs["Height"], height)
    g.set(bsdf.inputs["Normal"], bump.outputs["Normal"])
    emit = g.node("ShaderNodeEmission")
    mat["sockets"] = {"colour": colour.node.name, "metallic": metallic.node.name, "rough": rough.node.name}
    return mat, {"colour": colour, "metallic": metallic, "rough": rough, "bsdf": bsdf, "out": out, "emit": emit}


def bake(scene, ob, mat, sockets, size, folder, samples_ao=96):
    """Bake the glaze into the textures the GLB carries."""
    import bmesh  # noqa: F401  (keeps bpy's mesh ops loaded)

    nt = mat.node_tree
    w, h = size
    scene.render.bake.margin = 24
    scene.render.bake.margin_type = "EXTEND"
    scene.render.bake.use_clear = True
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    tex = nt.nodes.new("ShaderNodeTexImage")
    nt.nodes.active = tex

    def run(kind, img, **kw):
        tex.image = img
        bpy.ops.object.bake(type=kind, **kw)

    def new_image(name):
        # Raw floats, every one: the colour is turned into sRGB once, on saving.
        img = bpy.data.images.new(name, w, h, alpha=False, float_buffer=True)
        img.colorspace_settings.name = "Non-Color"
        return img

    out, emit, bsdf = sockets["out"], sockets["emit"], sockets["bsdf"]
    surface = out.inputs["Surface"]
    results = {}
    scene.cycles.samples = 1
    for key in ("colour", "metallic", "rough"):
        img = new_image(key)
        nt.links.new(sockets[key], emit.inputs["Color"])
        nt.links.new(emit.outputs[0], surface)
        run("EMIT", img)
        results[key] = img
    nt.links.new(bsdf.outputs[0], surface)

    img = new_image("normal")
    scene.cycles.samples = 4
    run("NORMAL", img, normal_space="TANGENT")
    results["normal"] = img

    img = new_image("ao")
    scene.cycles.samples = samples_ao
    run("AO", img)
    results["ao"] = img
    nt.nodes.remove(tex)
    return results


def save_textures(maps, folder, w, h, name="coin-hole", normal_size=None):
    """Write the textures: colour as sRGB JPEG, the occlusion/roughness/metal
    pack as JPEG, and the normal map as PNG (JPEG blocks show in reflections),
    at `normal_size` if given: it only carries the glaze's fine grain."""
    os.makedirs(folder, exist_ok=True)

    def px(img):
        return np.array(img.pixels[:], np.float32).reshape(h, w, 4)

    colour = px(maps["colour"])[..., :3]  # stored linear in a float image
    colour = np.where(colour <= 0.0031308, colour * 12.92, 1.055 * np.power(np.clip(colour, 0, None), 1 / 2.4) - 0.055)
    orm = np.stack([px(maps["ao"])[..., 0], px(maps["rough"])[..., 0], px(maps["metallic"])[..., 0]], -1)
    normal = px(maps["normal"])[..., :3]

    from PIL import Image

    def write(a, file, fmt, size=None, **kw):
        a = np.clip(np.round(a[::-1] * 255), 0, 255).astype(np.uint8)  # Blender's rows run bottom-up
        path = os.path.join(folder, file)
        im = Image.fromarray(a)
        if size:
            im = im.resize(size, Image.LANCZOS)
        im.save(path, fmt, **kw)
        return path

    return {
        "colour": write(colour, f"{name}_basecolor.jpg", "JPEG", quality=93, subsampling=0),
        "orm": write(orm, f"{name}_occlusion-roughness-metallic.jpg", "JPEG", quality=95, subsampling=0),
        "normal": write(normal, f"{name}_normal.png", "PNG", size=normal_size, optimize=True),
    }


def textured_material(paths, name="Glazed clay"):
    """The material the GLB carries: three textures on a Principled BSDF,
    wired the way Blender's glTF exporter reads them."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = True  # it is closed, so only one side of each face is ever seen
    nt = mat.node_tree
    g = Graph(nt)
    bsdf = nt.nodes["Principled BSDF"]

    def image(path, data):
        img = bpy.data.images.load(path)
        img.colorspace_settings.name = "Non-Color" if data else "sRGB"
        return g.node("ShaderNodeTexImage", image=img)

    col = image(paths["colour"], False)
    g.set(bsdf.inputs["Base Color"], col.outputs["Color"])
    orm = image(paths["orm"], True)
    sep = g.node("ShaderNodeSeparateColor")
    g.set(sep.inputs[0], orm.outputs["Color"])
    g.set(bsdf.inputs["Roughness"], sep.outputs[1])
    g.set(bsdf.inputs["Metallic"], sep.outputs[2])
    nrm = image(paths["normal"], True)
    nmap = g.node("ShaderNodeNormalMap", uv_map="UVMap")
    g.set(nmap.inputs["Color"], nrm.outputs["Color"])
    g.set(bsdf.inputs["Normal"], nmap.outputs["Normal"])

    # Ambient occlusion goes to the exporter through its settings group.
    group = bpy.data.node_groups.get("glTF Material Output") or bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    if not group.interface.items_tree:
        group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    settings = g.node("ShaderNodeGroup", node_tree=group)
    g.set(settings.inputs["Occlusion"], sep.outputs[0])
    return mat


def grey_material():
    mat = bpy.data.materials.new("Grey")
    mat.use_nodes = True
    p = mat.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (0.05, 0.035, 0.028, 1)
    p.inputs["Roughness"].default_value = 0.18
    p.inputs["Metallic"].default_value = 0.0
    return mat


def export_glb(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=False,
    )


VARIANTS = {
    # name: (texture size, preview prefix, AO samples, normal map size)
    "hole": ((4096, 1024), "", 96, None),
    "logo": ((4096, 4096), "logo_", 32, (2048, 2048)),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant", choices=sorted(VARIANTS), default="hole")
    ap.add_argument("--shape-only", action="store_true")
    ap.add_argument("--look", action="store_true", help="render the live procedural glaze, no bake or export")
    ap.add_argument("--samples", type=int, default=128)
    ap.add_argument("--tex", type=int, nargs=2, help="texture size (default: the variant's)")
    ap.add_argument("--turntable", type=int, default=0, metavar="FRAMES", help="also render a spin of this many frames")
    ap.add_argument("--turntable-only", action="store_true", help="reuse the textures already baked and only render the spin")
    ap.add_argument("--previews-only", action="store_true", help="reuse the textures already baked and only render the stills")
    ap.add_argument("--out", default=ROOT)
    args = ap.parse_args()
    tex, prefix, ao_samples, normal_size = VARIANTS[args.variant]
    tex = tuple(args.tex) if args.tex else tex
    name = f"coin-{args.variant}"

    scene = reset()
    params = dict(geo.PARAMS)
    mesh = geo.build_logo(params) if args.variant == "logo" else geo.as_mesh(*geo.build(params))
    coin = make_coin(mesh)
    studio(scene, "dark")

    import json

    circle = json.load(open(os.path.join(HERE, "hole_outline.json")))["photo_circle_px"]
    front = camera_front(scene, 415, 424, (circle["cx"], circle["cy"], circle["r"]))
    fit_path = os.path.join(HERE, "fit_camera.json")
    angle = None
    if os.path.exists(fit_path):
        fit = json.load(open(fit_path))
        angle = camera_fit(scene, 315, 413, [fit[k] for k in ("yaw", "pitch", "roll", "distance", "scale", "cx", "cy")])
    previews = os.path.join(args.out, "previews")
    os.makedirs(previews, exist_ok=True)
    show = previews_logo if args.variant == "logo" else previews_both

    if args.shape_only:
        coin.data.materials.append(grey_material())
        render(scene, front, (415, 424), os.path.join(previews, prefix + "shape_front.png"), args.samples)
        if angle:
            render(scene, angle, (315, 413), os.path.join(previews, prefix + "shape_angle.png"), args.samples)
        return

    proc, sockets = glaze_material(pooled="pool" in mesh["attrs"])
    coin.data.materials.append(proc)
    if args.look:
        show(scene, coin, front, angle, previews, args.samples, prefix + "look_")
        return
    if args.turntable_only or args.previews_only:
        folder = os.path.join(args.out, "textures")
        paths = {k: os.path.join(folder, f"{name}_{f}") for k, f in (
            ("colour", "basecolor.jpg"), ("orm", "occlusion-roughness-metallic.jpg"), ("normal", "normal.png"))}
        coin.data.materials.clear()
        coin.data.materials.append(textured_material(paths))
        if args.previews_only:
            show(scene, coin, front, angle, previews, args.samples, prefix)
        else:
            turntable(scene, coin, args.turntable or 72, previews, max(16, args.samples // 2), prefix)
        return
    maps = bake(scene, coin, proc, sockets, tex, None, samples_ao=ao_samples)
    paths = save_textures(maps, os.path.join(args.out, "textures"), *tex, name=name, normal_size=normal_size)
    coin.data.materials.clear()
    coin.data.materials.append(textured_material(paths))

    export_glb(coin, os.path.join(args.out, f"{name}.glb"))
    show(scene, coin, front, angle, previews, args.samples, prefix)
    if args.turntable:
        turntable(scene, coin, args.turntable, previews, max(16, args.samples // 2), prefix)


def turntable(scene, coin, frames, folder, samples, prefix="", size=540):
    """One full turn about the vertical axis, rendered from slightly above,
    then made into turntable.mp4 and turntable.gif on white."""
    import shutil
    import subprocess
    import tempfile

    studio(scene, "dark")
    cam = bpy.data.cameras.new("Turntable")
    cam.lens = 100
    ob = bpy.data.objects.new("Turntable", cam)
    elev = math.radians(8)
    dist = 0.155
    ob.location = (0, -dist * math.cos(elev), dist * math.sin(elev))
    ob.rotation_euler = _look_rotation(-np.array(ob.location))
    scene.collection.objects.link(ob)
    tmp = tempfile.mkdtemp()
    for i in range(frames):
        coin.rotation_euler = (0, 0, 2 * math.pi * i / frames)
        render(scene, ob, (size, size), os.path.join(tmp, f"f{i:04d}.png"), samples)
    coin.rotation_euler = (0, 0, 0)
    bg = ["-f", "lavfi", "-i", f"color=c=white:s={size}x{size}:r=24"]
    frames_in = ["-framerate", "24", "-i", os.path.join(tmp, "f%04d.png")]
    over = "[0][1]overlay=shortest=1"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *bg, *frames_in, "-filter_complex", over + ",format=yuv420p",
                    "-c:v", "libx264", "-crf", "18", os.path.join(folder, prefix + "turntable.mp4")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *bg, *frames_in, "-filter_complex",
                    over + ",scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192[p];[b][p]paletteuse=dither=sierra2_4a",
                    os.path.join(folder, prefix + "turntable.gif")], check=True)
    shutil.rmtree(tmp)


def previews_both(scene, coin, front, angle, folder, samples, prefix=""):
    studio(scene, "dark")
    render(scene, front, (415, 424), os.path.join(folder, prefix + "front.png"), samples)
    if angle:
        studio(scene, "tent")
        render(scene, angle, (315, 413), os.path.join(folder, prefix + "angle.png"), samples)
        side_by_side(
            [os.path.join(ROOT, "reference", "front.png"), os.path.join(folder, prefix + "front.png"),
             os.path.join(ROOT, "reference", "angle.png"), os.path.join(folder, prefix + "angle.png")],
            os.path.join(folder, prefix + "compare.png"),
        )


def previews_logo(scene, coin, front, angle, folder, samples, prefix=""):
    """The front, the back (turned over, so the logo should read the right way
    round), the angle of the second photo, and a close look at the pressing."""
    studio(scene, "dark")
    render(scene, front, (415, 424), os.path.join(folder, prefix + "front.png"), samples)
    coin.rotation_euler = (0, 0, math.pi)
    render(scene, front, (415, 424), os.path.join(folder, prefix + "back.png"), samples)
    coin.rotation_euler = (0, 0, 0)
    cam = bpy.data.cameras.new("Close")
    cam.lens = 85
    cam.clip_start = 0.005  # it is closer than Blender's default 10 cm
    ob = bpy.data.objects.new("Close", cam)
    az, el, dist = math.radians(28), math.radians(34), 0.105
    ob.location = (dist * math.sin(az) * math.cos(el), -dist * math.cos(az) * math.cos(el), dist * math.sin(el))
    ob.rotation_euler = _look_rotation(-np.array(ob.location))
    scene.collection.objects.link(ob)
    render(scene, ob, (640, 640), os.path.join(folder, prefix + "close.png"), samples)
    if angle:
        studio(scene, "tent")
        render(scene, angle, (315, 413), os.path.join(folder, prefix + "angle.png"), samples)
    side_by_side([os.path.join(folder, prefix + f) for f in ("front.png", "back.png", "angle.png") if os.path.exists(os.path.join(folder, prefix + f))],
                 os.path.join(folder, prefix + "compare.png"))


def side_by_side(paths, out, scale=2):
    """Photo, model, photo, model, on white."""
    from PIL import Image

    ims = []
    for p in paths:
        im = Image.open(p).convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        ims.append(bg.convert("RGB").resize((im.width * scale, im.height * scale), Image.LANCZOS))
    sheet = Image.new("RGB", (sum(i.width for i in ims), max(i.height for i in ims)), "white")
    x = 0
    for im in ims:
        sheet.paste(im, (x, 0))
        x += im.width
    sheet.save(out)


if __name__ == "__main__":
    main()
