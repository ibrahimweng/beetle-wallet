"""The coins' shapes, as numbers.

Everything is in units of the coin's radius (R = 1), with the coin lying in the
XY plane, its face towards +Z and the hole's point towards +Y. The front and
back are mirror images.

build() makes the coin with the hole; build_logo() the coin without it, with
the logo pressed in and, given LEGEND, the words raised round it (see there).

The coin with the hole is one quad grid wrapped twice: once around the hole (u) and once
around the cross-section (v), so it is a torus, which is what a coin with a hole
in it is. Each column of the grid is one slice through the coin:

    hole wall -> rolled bead -> field -> groove -> rim
    -> rounded outer edge -> side wall -> ... and back again on the other face.

Near the hole, the rings are true offsets of the hole's outline, so the rounded
lip is the same width all the way round, points included. Further out, the
rings are true circles, so the groove and the rim are perfectly round. In
between, on the field, one blends into the other.
"""
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))

# Measured from the two photographs (see README). Lengths are fractions of R.
PARAMS = {
    # The hole
    "hole_smooth": 0.006,  # smoothing of the measured outline
    "hole_shift": (-0.025, 0.0),  # the hole sits a touch left of centre, in both photos
    # Round the hole the clay is rolled into a bead: up the wall, over the top
    # and down onto the field. The bead is a quarter-ellipse and a bit more.
    "lip_width": 0.070,  # from the wall to the bead's crest
    "lip_height": 0.060,  # from the wall's straight part to the crest
    "lip_slope": -0.30,  # the bead's outer side, falling where it meets the field
    "lip_top": 0.131,  # how high it is there
    # The face, from the field to the side wall: (r, z, rounding at that corner).
    # Between the bead and the first point, the field is a thin plate (below).
    "profile": [
        (0.745, 0.1285, 0.0),
        (0.775, 0.1270, 0.004),  # the groove's inner lip, the bright line in the front photo
        (0.789, 0.1140, 0.004),  # the bottom of the groove
        (0.800, 0.1210, 0.006),
        (0.870, 0.1400, 0.060),  # up onto the rim
        (1.000, 0.1420, 0.075),  # the rounded outer edge
        (1.000, 0.0000, 0.0),  # the middle of the side wall
    ],
    "thickness": 1.27,  # scales every height, from fit_thickness.py
    # Resolution
    "around": 480,  # columns around the coin
    "wall_steps": 3,
    "lip_steps": 10,
    "field_steps": 16,
    "profile_step": 0.012,  # longest edge along the revolved profile
    "profile_angle": 9.0,  # most it turns per edge, in degrees
}


# ---------------------------------------------------------------- the hole


def _resample_closed(p, n):
    """n points evenly spaced by arc length along a closed polyline."""
    q = np.vstack([p, p[:1]])
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(q, axis=0), axis=1))]
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.c_[np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])], s[-1]


def hole_outline(params, dense=6000):
    """The hole's edge at its narrowest: a smooth closed curve, anticlockwise,
    starting at the bottom, as (points, outward normals, curvature)."""
    right = np.array(json.load(open(os.path.join(HERE, "hole_outline.json")))["right_half"])
    left = right[::-1].copy()
    left[:, 0] *= -1
    loop = np.vstack([right[:-1], left[:-1]])  # bottom -> up the right -> top -> down the left

    p, length = _resample_closed(loop, dense)
    ds = length / dense
    sigma = params["hole_smooth"] / ds
    k = np.arange(-int(4 * sigma) - 1, int(4 * sigma) + 2)
    w = np.exp(-0.5 * (k / sigma) ** 2)
    w /= w.sum()
    p = np.c_[
        np.convolve(np.r_[p[-len(k):, 0], p[:, 0], p[: len(k), 0]], w, "same")[len(k) : -len(k)],
        np.convolve(np.r_[p[-len(k):, 1], p[:, 1], p[: len(k), 1]], w, "same")[len(k) : -len(k)],
    ]
    p, length = _resample_closed(p, dense)
    p = p + np.array(params["hole_shift"])

    d1 = (np.roll(p, -1, 0) - np.roll(p, 1, 0)) / 2
    d2 = np.roll(p, -1, 0) - 2 * p + np.roll(p, 1, 0)
    speed = np.linalg.norm(d1, axis=1)
    tangent = d1 / speed[:, None]
    normal = np.c_[tangent[:, 1], -tangent[:, 0]]  # out of the hole, into the clay
    curvature = (d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / speed**3  # > 0 where the hole bulges out
    return p, normal, curvature


def _sample_around(params):
    """Pick the columns around the hole: evenly spaced along the outermost
    offset ring (so the rounded lip is not starved at the corners), mixed with
    evenly spaced in angle about the centre (so the round rim is not either)."""
    p, n, kappa = hole_outline(params)
    d = params["lip_width"]
    if np.any(kappa * max(d, lip_end(params)[1]) < -0.9):
        raise ValueError("the bead is wider than the hole's tightest inward curve allows")
    ring = p + d * n
    seg = np.linalg.norm(np.roll(ring, -1, 0) - ring, axis=1)
    phi = np.unwrap(np.arctan2(ring[:, 1], ring[:, 0]))
    dphi = np.diff(np.r_[phi, phi[0] + 2 * np.pi])
    if np.any(dphi <= 0):
        raise ValueError("the lip's outer edge is not star-shaped about the centre")
    m = 0.5 * seg / seg.sum() + 0.5 * dphi / (2 * np.pi)
    m = np.r_[0, np.cumsum(m)][:-1]
    m /= m[-1] + (0.5 * seg[-1] / seg.sum() + 0.5 * dphi[-1] / (2 * np.pi))
    t = np.linspace(0, 1, params["around"], endpoint=False)
    idx = np.interp(t, m, np.arange(len(p)))
    i0 = np.floor(idx).astype(int)
    f = (idx - i0)[:, None]
    i1 = (i0 + 1) % len(p)
    hp = p[i0] * (1 - f) + p[i1] * f
    hn = n[i0] * (1 - f) + n[i1] * f
    hn /= np.linalg.norm(hn, axis=1)[:, None]
    return t, hp, hn


# --------------------------------------------------------- the revolved part


def _fillet_polyline(points, step, max_angle):
    """Sample a polyline whose corners are rounded with the given radii."""
    pts = [np.array(p[:2], float) for p in points]
    radii = [p[2] for p in points]
    pieces = []  # ("line", a, b) or ("arc", centre, r, a0, a1, end_point)
    cursor = pts[0]
    for i in range(1, len(pts) - 1):
        a, b, c = pts[i - 1], pts[i], pts[i + 1]
        u1 = (b - a) / np.linalg.norm(b - a)
        u2 = (c - b) / np.linalg.norm(c - b)
        turn = math.atan2(u1[0] * u2[1] - u1[1] * u2[0], float(u1 @ u2))
        r = radii[i]
        if r <= 0 or abs(turn) < 1e-9:
            pieces.append(("line", cursor, b))
            cursor = b
            continue
        t = r * math.tan(abs(turn) / 2)
        t = min(t, 0.5 * np.linalg.norm(b - a), 0.5 * np.linalg.norm(c - b))
        r = t / math.tan(abs(turn) / 2)
        p1, p2 = b - u1 * t, b + u2 * t
        left = np.array([-u1[1], u1[0]]) * (1 if turn > 0 else -1)
        centre = p1 + left * r
        a0 = math.atan2(*(p1 - centre)[::-1])
        pieces.append(("line", cursor, p1))
        pieces.append(("arc", centre, r, a0, a0 + turn, p2))
        cursor = p2
    pieces.append(("line", cursor, pts[-1]))

    out = [pts[0]]
    for piece in pieces:
        if piece[0] == "line":
            _, a, b = piece
            n = max(1, math.ceil(np.linalg.norm(b - a) / step))
            out += [a + (b - a) * (j / n) for j in range(1, n + 1)]
        else:
            _, centre, r, a0, a1, _ = piece
            n = max(1, math.ceil(abs(a1 - a0) / math.radians(max_angle)), math.ceil(r * abs(a1 - a0) / step))
            out += [centre + r * np.array([math.cos(a0 + (a1 - a0) * j / n), math.sin(a0 + (a1 - a0) * j / n)]) for j in range(1, n + 1)]
    out = np.array(out)
    keep = np.r_[True, np.linalg.norm(np.diff(out, axis=0), axis=1) > 1e-7]
    return out[keep]


def revolved_profile(params):
    return _fillet_polyline(params["profile"], params["profile_step"], params["profile_angle"])


# ------------------------------------------------------------------ the mesh


def field_surface(params, ring, r0, z0, slope0, n=360):
    """The field as a thin elastic plate.

    It is clamped along the bead, where it must leave at the bead's height and
    slope, and along the circle where the revolved profile takes over, where it
    must arrive at the profile's height and slope. In between it takes the
    smoothest shape that does both: a soft hollow below the bead that rises to
    meet the groove. Solving for it,
    rather than drawing it along each column, keeps it free of the streaks that
    columns of differing length and angle would leave in the reflections.

    Returns z(xy) for points in the field."""
    from scipy import sparse
    from scipy.ndimage import map_coordinates
    from scipy.sparse.linalg import spsolve
    from scipy.spatial import cKDTree
    from skimage.measure import points_in_poly

    lim = r0 + 0.03
    h = 2 * lim / (n - 1)
    ax = np.linspace(-lim, lim, n)
    gx, gy = np.meshgrid(ax, ax, indexing="xy")
    pts = np.c_[gx.ravel(), gy.ravel()]
    r = np.hypot(gx, gy)

    dense = np.vstack([ring[i] + (ring[(i + 1) % len(ring)] - ring[i]) * f for i in range(len(ring)) for f in (0, 0.25, 0.5, 0.75)])
    dist = cKDTree(dense).query(pts)[0].reshape(n, n)
    inside = points_in_poly(pts, ring).reshape(n, n)
    sd = np.where(inside, -dist, dist)  # signed distance from the lip, positive into the field

    inner = params["lip_top"] + params["lip_slope"] * sd
    outer = z0 + slope0 * (r - r0)
    known = np.where(inside, inner, outer)
    unknown = ~inside & (r < r0)

    idx = -np.ones((n, n), int)
    idx[unknown] = np.arange(unknown.sum())
    stencil = [(0, 0, 20.0)]
    stencil += [(dy, dx, -8.0) for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0))]
    stencil += [(dy, dx, 2.0) for dy, dx in ((1, 1), (1, -1), (-1, 1), (-1, -1))]
    stencil += [(dy, dx, 1.0) for dy, dx in ((0, 2), (0, -2), (2, 0), (-2, 0))]
    iy, ix = np.nonzero(unknown)
    rows, cols, vals = [], [], []
    rhs = np.zeros(len(iy))
    me = idx[iy, ix]
    for dy, dx, c in stencil:
        jy, jx = iy + dy, ix + dx
        j = idx[jy, jx]
        free = j >= 0
        rows.append(me[free])
        cols.append(j[free])
        vals.append(np.full(free.sum(), c))
        rhs[~free] -= c * known[jy[~free], jx[~free]]
    a = sparse.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(len(iy), len(iy)))
    z = known.copy()
    z[unknown] = spsolve(a.tocsc(), rhs)

    def at(xy):
        c = (xy + lim) / h
        return map_coordinates(z, [c[:, 1], c[:, 0]], order=3, mode="nearest")

    return at


def lip_end(params):
    """Where the bead hands over to the field: (angle along the ellipse,
    offset from the hole, height above the wall's top). Past a quarter turn
    when the slope there is falling."""
    a, b = params["lip_width"], params["lip_height"]
    t = math.atan2(b / a, params["lip_slope"])
    return t, a * (1 - math.cos(t)), b * math.sin(t)


def build(params=PARAMS):
    """Return (vertices (n, 3), quads (m, 4), uvs per quad corner (m, 4, 2))."""
    t, hp, hn = _sample_around(params)
    nu = len(t)
    a, b = params["lip_width"], params["lip_height"]
    t_end, d_end, h_end = lip_end(params)
    z_top = params["lip_top"]
    z_wall = z_top - h_end
    if z_wall <= 0:
        raise ValueError("the lip is taller than the hole wall")
    prof = revolved_profile(params)
    r0, z0 = prof[0]
    slope0 = (prof[1, 1] - prof[0, 1]) / (prof[1, 0] - prof[0, 0])

    # One slice through the front face, for every column at once: (nu, k, 3)
    cols = []

    def add(xy, z):
        cols.append(np.c_[xy, np.full(len(xy), z) if np.isscalar(z) else z])

    for z in np.linspace(0, z_wall, params["wall_steps"] + 1):
        add(hp, z)
    for s in np.linspace(0, t_end, params["lip_steps"] + 1)[1:]:
        add(hp + hn * a * (1 - math.cos(s)), z_wall + b * math.sin(s))

    # The field: laid out straight out from the centre, from the lip to the
    # circle where the revolved profile starts; its heights come from the plate.
    q0 = hp + hn * d_end
    phi = np.arctan2(q0[:, 1], q0[:, 0])
    if np.any(np.diff(np.unwrap(np.r_[phi, phi[0]])) <= 0):
        raise ValueError("the bead's outer edge is not star-shaped about the centre")
    circle = np.c_[np.cos(phi), np.sin(phi)]
    q1 = circle * r0
    plate = field_surface(params, q0, r0, z0, slope0)
    for w in np.linspace(0, 1, params["field_steps"] + 1)[1:-1]:
        xy = q0 + (q1 - q0) * w
        add(xy, plate(xy))
    for r, z in prof:
        add(circle * r, z)
    front = np.stack(cols, axis=1)  # (nu, kf, 3)
    front[..., 2] *= params["thickness"]

    back = front[:, -2:0:-1].copy()
    back[..., 2] *= -1
    loop = np.concatenate([front, back], axis=1)  # (nu, nv, 3), closed both ways
    nv = loop.shape[1]

    verts = loop.reshape(-1, 3)
    ii, kk = np.meshgrid(np.arange(nu), np.arange(nv), indexing="ij")
    i1, k1 = (ii + 1) % nu, (kk + 1) % nv
    quads = np.stack([ii * nv + kk, i1 * nv + kk, i1 * nv + k1, ii * nv + k1], axis=-1).reshape(-1, 4)

    # u: the fraction of the way round; v: the fraction of the way across the
    # slice, by length, so texels stay square-ish whatever the slice's length.
    seg = np.linalg.norm(np.roll(loop, -1, axis=1) - loop, axis=2)
    v = np.concatenate([np.zeros((nu, 1)), np.cumsum(seg, axis=1)], axis=1)
    v /= v[:, -1:]
    u = np.r_[t, 1.0]
    uv = np.stack(
        [
            np.stack([u[ii], v[ii, kk]], -1),
            np.stack([u[ii + 1], v[i1, kk]], -1),
            np.stack([u[ii + 1], v[i1, kk + 1]], -1),
            np.stack([u[ii], v[ii, kk + 1]], -1),
        ],
        axis=2,
    ).reshape(-1, 4, 2)

    # Make the quads face outwards.
    tri = verts[quads[:, [0, 1, 2]]]
    vol = np.einsum("ij,ij->i", tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum()
    if vol < 0:
        quads = quads[:, ::-1]
        uv = uv[:, ::-1]
    return verts, quads, uv


# --------------------------------------------- the coin without the hole, with the logo

# The same coin, with the field carried level across the middle and the Beetle
# logo pressed into it, front and back. The logo on the back is
# mirrored in the model, so it reads the right way round when the coin is
# turned over.
LOGO = {
    "svg": os.path.join(HERE, "..", "reference", "beetle-logo.svg"),
    "level_inside": 0.50,  # the field rises gently from the groove and is level inside this radius
    "reach": 0.56,  # from the logo's centre to its farthest point, in coin radii
    "depth": 0.020,  # how far it is pressed in, before the thickness scale
    "wall": 0.006,  # half the width of its soft walls, where the clay rounds over
    "wall_levels": (-1.5, -1.0, -0.75, -0.5, -0.25, 0.0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.5),  # rings of points, in walls
    "wall_step": 0.003,  # spacing of points along each ring
    "field_step": 0.02,  # spacing of points across the flat
    "grid": 4096,  # resolution of the distance field the walls are read from
}


def logo_outline(logo):
    """The logo's shapes as closed polygons, centred, y up, scaled to `reach`."""
    from svgpathtools import svg2paths

    polys = []
    for path in svg2paths(logo["svg"])[0]:
        for sub in path.continuous_subpaths():
            n = max(400, int(sub.length() / 0.25))
            pts = np.array([sub.point(t) for t in np.linspace(0, 1, n, endpoint=False)])
            polys.append(np.c_[pts.real, -pts.imag])
    every = np.vstack(polys)
    centre = (every.min(0) + every.max(0)) / 2
    scale = logo["reach"] / np.linalg.norm(every - centre, axis=1).max()
    return [(p - centre) * scale for p in polys]


def logo_distance(logo, polys):
    """Signed distance to the logo's outline, negative inside it, as a grid
    with a function to read it anywhere."""
    from PIL import Image, ImageDraw
    from scipy.ndimage import distance_transform_edt, map_coordinates

    n = logo["grid"]
    lim = logo["reach"] + 0.06
    px = 2 * lim / (n - 1)
    img = Image.new("1", (n, n), 0)
    draw = ImageDraw.Draw(img)
    for p in polys:
        draw.polygon([((x + lim) / px, (lim - y) / px) for x, y in p], fill=1)
    inside = np.asarray(img, bool)
    sd = np.where(inside, -(distance_transform_edt(inside) - 0.5), distance_transform_edt(~inside) - 0.5) * px

    def at(xy):
        xy = np.atleast_2d(xy)
        return map_coordinates(sd, [(lim - xy[:, 1]) / px, (xy[:, 0] + lim) / px], order=1, mode="nearest")

    def contours(level):
        from skimage import measure

        return [np.c_[c[:, 1] * px - lim, lim - c[:, 0] * px] for c in measure.find_contours(sd, level)]

    return at, contours


# The legend: words set round the logo, the way a country's coins letter
# their name and year. The top line reads clockwise with its feet towards the
# middle; the bottom line reads anticlockwise with its heads towards the middle,
# so both read upright. A small dot sits in each gap between them. The letters
# stand up from the field.
LEGEND = {
    "font": os.path.join(HERE, "..", "fonts", "Cinzel-SemiBold.woff"),
    "front": ("BEETLE", "2026"),
    "back": ("TRUSTED HUMAN", "INTELLIGENCE"),  # as read with the coin turned over
    "cap": 0.095,  # height of the capitals, in coin radii
    "inner": 0.640,  # the circle the letters' inner ends sit on
    "tracking": 0.25,  # extra space between letters, in capital heights
    "dot": 0.015,  # radius of the dots between the lines; 0 for none
    "raise": 0.0085,  # how far the letters stand up, before the thickness scale: their tops come level with the rim
    "wall": 0.0018,  # half the width of their soft sides
    "wall_levels": (-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5),
    "wall_step": 0.0015,
    "grid": 5120,
}


def _glyphs(path):
    """Each character's outline, as closed polygons in font units (y up), with
    its advance and the font's capital height."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.ttLib import TTFont
    from svgpathtools import parse_path

    font = TTFont(path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    cache = {}

    def outline(ch):
        if ch not in cache:
            name = cmap[ord(ch)]
            pen = SVGPathPen(glyph_set)
            glyph_set[name].draw(pen)
            polys = []
            d = pen.getCommands()
            if d:
                for sub in parse_path(d).continuous_subpaths():
                    n = max(24, int(sub.length() / 4))
                    pts = np.array([sub.point(t) for t in np.linspace(0, 1, n, endpoint=False)])
                    polys.append(np.c_[pts.real, pts.imag])
            cache[ch] = (polys, font["hmtx"][name][0])
        return cache[ch]

    return outline, font["OS/2"].sCapHeight


def legend_outline(lines, legend=LEGEND):
    """The legend for one face, as (polygon, winding) pairs in coin radii, y up,
    as read on that face."""
    outline, cap_units = _glyphs(legend["font"])
    cap, inner = legend["cap"], legend["inner"]
    s = cap / cap_units
    r_mid = inner + cap / 2
    shapes, spans = [], []
    for where, text in zip(("top", "bottom"), lines):
        widths = [outline(ch)[1] * s for ch in text]
        gap = legend["tracking"] * cap
        total = sum(widths) + gap * (len(text) - 1)
        span = total / r_mid
        spans.append(span)
        x = 0.0
        for ch, w in zip(text, widths):
            centre = x + w / 2
            x += w + gap
            polys, adv = outline(ch)
            if where == "top":  # clockwise from the left, feet on the inner circle
                th = math.pi / 2 + span / 2 - centre / r_mid
                e_r = np.array([math.cos(th), math.sin(th)])
                right, up, base = np.array([math.sin(th), -math.cos(th)]), e_r, inner
            else:  # anticlockwise from the left, heads on the inner circle
                th = -math.pi / 2 - span / 2 + centre / r_mid
                e_r = np.array([math.cos(th), math.sin(th)])
                right, up, base = np.array([-math.sin(th), math.cos(th)]), -e_r, inner + cap
            for p in polys:
                gx = (p[:, 0] - adv / 2) * s
                gy = p[:, 1] * s
                shapes.append(base * e_r + gx[:, None] * right + gy[:, None] * up)
    if legend["dot"] > 0:
        shift = (spans[0] - spans[1]) / 4
        for th in (math.pi + shift, -shift):
            a = np.linspace(0, 2 * math.pi, 48, endpoint=False)
            shapes.append(np.c_[r_mid * math.cos(th) + legend["dot"] * np.cos(a), r_mid * math.sin(th) + legend["dot"] * np.sin(a)])
    out = []
    for p in shapes:
        area = 0.5 * np.sum(p[:, 0] * np.roll(p[:, 1], -1) - np.roll(p[:, 0], -1) * p[:, 1])
        out.append((p, 1 if area > 0 else -1))
    return out, [math.degrees(x) for x in spans]


def legend_distance(shapes, legend=LEGEND):
    """Signed distance to the legend's letters (negative inside), as for the logo:
    the letters are filled by their winding, so the holes in B and 0 stay open."""
    from PIL import Image, ImageDraw
    from scipy.ndimage import distance_transform_edt, map_coordinates
    from skimage import measure

    n = legend["grid"]
    lim = legend["inner"] + legend["cap"] + 0.03
    px = 2 * lim / (n - 1)
    winding = np.zeros((n, n), np.int16)
    for p, sign in shapes:
        cols, rows = (p[:, 0] + lim) / px, (lim - p[:, 1]) / px
        c0, r0 = int(cols.min()) - 1, int(rows.min()) - 1
        c1, r1 = int(cols.max()) + 2, int(rows.max()) + 2
        img = Image.new("1", (c1 - c0, r1 - r0), 0)
        ImageDraw.Draw(img).polygon(list(zip(cols - c0, rows - r0)), fill=1)
        winding[r0:r1, c0:c1] += sign * np.asarray(img, np.int16)
    inside = winding != 0
    sd = np.where(inside, -(distance_transform_edt(inside) - 0.5), distance_transform_edt(~inside) - 0.5) * px

    def at(xy):
        xy = np.atleast_2d(xy)
        return map_coordinates(sd, [(lim - xy[:, 1]) / px, (xy[:, 0] + lim) / px], order=1, mode="nearest")

    def contours(level):
        return [np.c_[c[:, 1] * px - lim, lim - c[:, 0] * px] for c in measure.find_contours(sd, level)]

    return at, contours


def smootherstep(t):
    t = np.clip(t, 0, 1)
    return t * t * t * (t * (6 * t - 15) + 10)


def _resample_open(p, step, closed=True):
    q = np.vstack([p, p[:1]]) if closed else p
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(q, axis=0), axis=1))]
    n = max(3, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n, endpoint=not closed)
    return np.c_[np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])]


def build_logo(params=PARAMS, logo=LOGO, legend=None):
    """The coin without the hole, the logo pressed in, and with `legend` the
    words set round it, raised. Returns a dict: vertices, faces (as one flat
    list of vertex indices and the size of each face), a uv per face corner, and
    per-vertex `pool` (where the glaze lies thick: in the logo, and round the
    feet of the letters) and `brk` (where it runs thin: the logo's top edge and
    the letters' faces), which the glaze uses."""
    from scipy.spatial import Delaunay

    prof = revolved_profile(params)
    r0, z0 = prof[0]
    slope0 = (prof[1, 1] - prof[0, 1]) / (prof[1, 0] - prof[0, 0])
    r1 = logo["level_inside"]
    span = r0 - r1

    def field(r):
        """Level inside r1; outside it, the slope eases in until it is the
        profile's own at r0, so the two meet without a crease."""
        t = np.clip((r - r1) / span, 0, 1)
        return z0 - slope0 * span * (0.5 - (t ** 3 - t ** 4 / 2))

    nu = params["around"]
    phi = 2 * np.pi * np.arange(nu) / nu
    ring = np.c_[np.cos(phi), np.sin(phi)] * r0
    logo_dist, logo_contours = logo_distance(logo, logo_outline(logo))

    def walls(contours, levels, width, step):
        out = []
        for level in levels:
            for c in contours(level * width):
                if len(c) > 8:
                    out.append(_resample_open(c, step))
        return np.vstack(out)

    def face(lines):
        """One face as read from in front of it: 2D points (the rim's circle
        first), triangles facing +z, heights, and the glaze's two attributes."""
        w, depth = logo["wall"], logo["depth"]
        parts = [walls(logo_contours, logo["wall_levels"], w, logo["wall_step"])]
        bands = [(logo_dist, min(logo["wall_levels"]) * w, max(logo["wall_levels"]) * w)]
        text_dist = None
        if lines:
            text_dist, text_contours = legend_distance(legend_outline(lines, legend)[0], legend)
            wt = legend["wall"]
            parts.append(walls(text_contours, legend["wall_levels"], wt, legend["wall_step"]))
            bands.append((text_dist, min(legend["wall_levels"]) * wt, max(legend["wall_levels"]) * wt))

        # An even scatter over the flat, kept clear of the walls.
        f = logo["field_step"]
        gx, gy = np.meshgrid(np.arange(-r0, r0 + f, f), np.arange(-r0, r0 + f, f * math.sqrt(3) / 2))
        gx = gx + (np.arange(gx.shape[0])[:, None] % 2) * f / 2
        grid = np.c_[gx.ravel(), gy.ravel()]
        grid = grid[np.hypot(grid[:, 0], grid[:, 1]) < r0 - 0.6 * f]
        for dist, lo, hi in bands:
            d = dist(grid)
            grid = grid[(d < lo - 0.6 * f) | (d > hi + 0.6 * f)]
        inner = np.vstack(parts + [grid])
        inner = inner[np.hypot(inner[:, 0], inner[:, 1]) < r0 - 0.3 * f]
        pts2 = np.vstack([ring, inner])
        tris = Delaunay(pts2).simplices
        a, b, c = pts2[tris[:, 0]], pts2[tris[:, 1]], pts2[tris[:, 2]]
        cross = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
        tris = np.where((cross < 0)[:, None], tris[:, [0, 2, 1]], tris)  # anticlockwise: facing +z
        tris = tris[np.abs(cross) > 1e-12]

        dd = logo_dist(pts2)
        pressed = 1 - smootherstep((dd + w) / (2 * w))
        r = np.hypot(pts2[:, 0], pts2[:, 1])
        z = field(r) - depth * pressed
        pool = pressed
        brk = np.exp(-(((dd - 1.1 * w) / (0.6 * w)) ** 2))
        if text_dist is not None:
            dt = text_dist(pts2)
            raised = 1 - smootherstep((dt + wt) / (2 * wt))
            z = z + legend["raise"] * raised
            pool = np.maximum(pool, 0.35 * np.exp(-(((dt - 1.4 * wt) / (1.0 * wt)) ** 2)))
            brk = np.maximum(brk, 0.75 * raised)
        z = z * params["thickness"]
        z[:nu] = z0 * params["thickness"]
        return pts2, tris, z, pool, brk

    front_pts, front_tris, front_z, front_pool, front_brk = face(legend["front"] if legend else None)
    back_pts, back_tris, back_z, back_pool, back_brk = face(legend["back"] if legend else None)

    # The rim and side: the revolved profile, front then back.
    rows = np.c_[prof[:, 0], prof[:, 1] * params["thickness"]]
    rows = np.vstack([rows, rows[-2::-1] * [1, -1]])
    nr = len(rows)
    circle = np.c_[np.cos(phi), np.sin(phi)]
    strip = np.concatenate([circle[:, None, :] * rows[None, :, :1], np.broadcast_to(rows[None, :, 1:], (nu, nr, 1))], axis=2)

    mf, mb = len(front_pts) - nu, len(back_pts) - nu
    verts = np.vstack([
        strip.reshape(-1, 3),
        np.c_[front_pts[nu:], front_z[nu:]],
        # The back is designed as it is read, from behind, so in the model it
        # is mirrored: its words and logo read the right way round when the
        # coin is turned over.
        np.c_[-back_pts[nu:, 0], back_pts[nu:, 1], -back_z[nu:]],
    ])
    base_f, base_b = nu * nr, nu * nr + mf

    def front_index(i):
        return np.where(i < nu, i * nr, base_f + i - nu)

    def back_index(i):
        mirror = (nu // 2 - i) % nu  # the column at pi - phi
        return np.where(i < nu, mirror * nr + (nr - 1), base_b + i - nu)

    faces_front = front_index(front_tris)
    faces_back = back_index(back_tris)  # mirroring turns them round, so they face -z

    jj, rr = np.meshgrid(np.arange(nu), np.arange(nr - 1), indexing="ij")
    j1 = (jj + 1) % nu
    quads = np.stack([jj * nr + rr, jj * nr + rr + 1, j1 * nr + rr + 1, j1 * nr + rr], -1).reshape(-1, 4)
    flip = False
    q = quads[nr // 2 - 1]  # on the side wall: it should face outwards
    n = np.cross(verts[q[1]] - verts[q[0]], verts[q[2]] - verts[q[0]])
    if n[:2] @ verts[q[0], :2] < 0:
        quads, flip = quads[:, ::-1], True

    # uv: the front in the top-left square, the back in the top-right, the
    # rim and side along the bottom half.
    sc = 0.245 / r0
    uv_front = np.c_[0.25 + front_pts[:, 0] * sc, 0.75 + front_pts[:, 1] * sc]
    uv_back = np.c_[0.75 + back_pts[:, 0] * sc, 0.75 + back_pts[:, 1] * sc]
    seg = np.linalg.norm(np.diff(rows, axis=0), axis=1)
    vrow = 0.01 + 0.48 * np.r_[0, np.cumsum(seg)] / seg.sum()
    ucol = np.r_[np.arange(nu) / nu, 1.0]
    uv_quads = np.stack([
        np.c_[ucol[jj.ravel()], vrow[rr.ravel()]],
        np.c_[ucol[jj.ravel()], vrow[rr.ravel() + 1]],
        np.c_[ucol[jj.ravel() + 1], vrow[rr.ravel() + 1]],
        np.c_[ucol[jj.ravel() + 1], vrow[rr.ravel()]],
    ], 1)
    if flip:
        uv_quads = uv_quads[:, ::-1]

    loops = np.concatenate([faces_front.ravel(), faces_back.ravel(), quads.ravel()])
    sizes = np.r_[np.full(len(front_tris) + len(back_tris), 3), np.full(len(quads), 4)]
    uv = np.vstack([uv_front[front_tris].reshape(-1, 2), uv_back[back_tris].reshape(-1, 2), uv_quads.reshape(-1, 2)])

    pool = np.zeros(len(verts))
    brk = np.zeros(len(verts))
    pool[base_f:base_b], pool[base_b:] = front_pool[nu:], back_pool[nu:]
    brk[base_f:base_b], brk[base_b:] = front_brk[nu:], back_brk[nu:]
    return {"verts": verts, "loops": loops, "sizes": sizes, "uv": uv, "attrs": {"pool": pool, "brk": brk}}


def as_mesh(verts, quads, uv):
    """The coin with the hole, in the same form as build_logo's."""
    return {"verts": verts, "loops": quads.ravel(), "sizes": np.full(len(quads), 4), "uv": uv.reshape(-1, 2), "attrs": {}}


def check(mesh):
    """Every edge shared by exactly two faces, the faces turned consistently and
    outwards, and the volume it encloses."""
    loops, sizes, v = mesh["loops"], mesh["sizes"], mesh["verts"]
    starts = np.r_[0, np.cumsum(sizes)[:-1]]
    edges = {}
    vol = 0.0
    for s0, n in zip(starts, sizes):
        f = loops[s0 : s0 + n]
        for i in range(n):
            e = (f[i], f[(i + 1) % n])
            edges[e] = edges.get(e, 0) + 1
        for i in range(1, n - 1):
            vol += v[f[0]] @ np.cross(v[f[i]], v[f[i + 1]]) / 6
    bad = sum(1 for (a, b), c in edges.items() if c != 1 or edges.get((b, a), 0) != 1)
    return bad, vol


if __name__ == "__main__":
    v, q, uv = build()
    print(f"with the hole: {len(v)} vertices, {len(q)} quads, {2 * len(q)} triangles")
    print("extent", v.min(0).round(4), v.max(0).round(4))
    for label, legend in (("with the logo", None), ("with the logo and legend", LEGEND)):
        mesh = build_logo(legend=legend)
        bad, vol = check(mesh)
        tris = int((mesh["sizes"] - 2).sum())
        print(f"{label}: {len(mesh['verts'])} vertices, {tris} triangles; {bad} bad edges; volume {vol:.4f} R^3")
        print("extent", mesh["verts"].min(0).round(4), mesh["verts"].max(0).round(4))
