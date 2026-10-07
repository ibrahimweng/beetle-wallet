"""The coin's shape, as numbers.

Everything is in units of the coin's radius (R = 1), with the coin lying in the
XY plane, its face towards +Z and the hole's point towards +Y. The front and
back are mirror images.

The mesh is one quad grid wrapped twice: once around the hole (u) and once
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


def smootherstep(t):
    t = np.clip(t, 0, 1)
    return t * t * t * (t * (6 * t - 15) + 10)


def _resample_open(p, step, closed=True):
    q = np.vstack([p, p[:1]]) if closed else p
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(q, axis=0), axis=1))]
    n = max(3, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n, endpoint=not closed)
    return np.c_[np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])]


def build_logo(params=PARAMS, logo=LOGO):
    """The coin without the hole. Returns a dict: vertices, faces (as one flat
    list of vertex indices and the size of each face), a uv per face corner, and
    per-vertex `pool` (1 where the logo is pressed in) and `brk` (the top edge of
    its walls), which the glaze uses."""
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
    w, depth = logo["wall"], logo["depth"]

    polys = logo_outline(logo)
    dist, contours = logo_distance(logo, polys)

    # Points for one face: the rim's first circle, rings that follow the logo's
    # walls, and an even scatter over the rest.
    phi = 2 * np.pi * np.arange(nu) / nu
    ring = np.c_[np.cos(phi), np.sin(phi)] * r0
    walls = []
    for level in logo["wall_levels"]:
        for c in contours(level * w):
            if len(c) > 8:
                walls.append(_resample_open(c, logo["wall_step"]))
    walls = np.vstack(walls)
    f = logo["field_step"]
    gx, gy = np.meshgrid(np.arange(-r0, r0 + f, f), np.arange(-r0, r0 + f, f * math.sqrt(3) / 2))
    gx = gx + (np.arange(gx.shape[0])[:, None] % 2) * f / 2
    grid = np.c_[gx.ravel(), gy.ravel()]
    grid = grid[np.hypot(grid[:, 0], grid[:, 1]) < r0 - 0.6 * f]
    d = dist(grid)
    lo, hi = min(logo["wall_levels"]) * w - 0.6 * f, max(logo["wall_levels"]) * w + 0.6 * f
    grid = grid[(d < lo) | (d > hi)]
    inner = np.vstack([walls, grid])
    inner = inner[np.hypot(inner[:, 0], inner[:, 1]) < r0 - 0.3 * f]
    pts2 = np.vstack([ring, inner])
    tris = Delaunay(pts2).simplices
    a, b, c = pts2[tris[:, 0]], pts2[tris[:, 1]], pts2[tris[:, 2]]
    cross = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
    tris = np.where((cross < 0)[:, None], tris[:, [0, 2, 1]], tris)  # anticlockwise: facing +z
    tris = tris[np.abs(cross) > 1e-12]

    dd = dist(pts2)
    pressed = 1 - smootherstep((dd + w) / (2 * w))
    r = np.hypot(pts2[:, 0], pts2[:, 1])
    z_face = (field(r) - depth * pressed) * params["thickness"]
    z_face[:nu] = z0 * params["thickness"]
    brk = np.exp(-(((dd - 1.1 * w) / (0.6 * w)) ** 2))

    # The rim and side: the revolved profile, front then back.
    rows = np.c_[prof[:, 0], prof[:, 1] * params["thickness"]]
    rows = np.vstack([rows, rows[-2::-1] * [1, -1]])
    nr = len(rows)
    circle = np.c_[np.cos(phi), np.sin(phi)]
    strip = np.concatenate([circle[:, None, :] * rows[None, :, :1], np.broadcast_to(rows[None, :, 1:], (nu, nr, 1))], axis=2)

    m = len(inner)
    verts = np.vstack([
        strip.reshape(-1, 3),
        np.c_[inner, z_face[nu:]],
        np.c_[-inner[:, 0], inner[:, 1], -z_face[nu:]],  # the back, mirrored so the logo reads from behind
    ])
    base_f, base_b = nu * nr, nu * nr + m

    def front_index(i):
        return np.where(i < nu, i * nr, base_f + i - nu)

    def back_index(i):
        mirror = (nu // 2 - i) % nu  # the column at pi - phi
        return np.where(i < nu, mirror * nr + (nr - 1), base_b + i - nu)

    faces_front = front_index(tris)
    faces_back = back_index(tris)  # mirroring turns them round, so they face -z

    jj, rr = np.meshgrid(np.arange(nu), np.arange(nr - 1), indexing="ij")
    j1 = (jj + 1) % nu
    quads = np.stack([jj * nr + rr, jj * nr + rr + 1, j1 * nr + rr + 1, j1 * nr + rr], -1).reshape(-1, 4)
    # Face the side wall outwards.
    side = nr // 2 - 1
    q = quads[side]
    n = np.cross(verts[q[1]] - verts[q[0]], verts[q[2]] - verts[q[0]])
    if n @ verts[q[0]] * np.array([1, 1, 0]).sum() < 0 or n[:2] @ verts[q[0], :2] < 0:
        quads = quads[:, ::-1]

    # uv: the front in the top-left square, the back in the top-right, the
    # rim and side along the bottom half.
    sc = 0.245 / r0
    uv_front = np.c_[0.25 + pts2[:, 0] * sc, 0.75 + pts2[:, 1] * sc]
    uv_back = np.c_[0.75 + pts2[:, 0] * sc, 0.75 + pts2[:, 1] * sc]
    seg = np.linalg.norm(np.diff(rows, axis=0), axis=1)
    vrow = 0.01 + 0.48 * np.r_[0, np.cumsum(seg)] / seg.sum()
    ucol = np.r_[np.arange(nu) / nu, 1.0]
    uv_quads = np.stack([
        np.c_[ucol[jj.ravel()], vrow[rr.ravel()]],
        np.c_[ucol[jj.ravel()], vrow[rr.ravel() + 1]],
        np.c_[ucol[jj.ravel() + 1], vrow[rr.ravel() + 1]],
        np.c_[ucol[jj.ravel() + 1], vrow[rr.ravel()]],
    ], 1)
    if quads is not None and (quads[0] != np.array([0, 1, nr + 1, nr])).any():
        uv_quads = uv_quads[:, ::-1]

    loops = np.concatenate([faces_front.ravel(), faces_back.ravel(), quads.ravel()])
    sizes = np.r_[np.full(len(tris) * 2, 3), np.full(len(quads), 4)]
    uv = np.vstack([uv_front[tris].reshape(-1, 2), uv_back[tris].reshape(-1, 2), uv_quads.reshape(-1, 2)])

    attr = np.zeros(len(verts))
    pool = attr.copy()
    pool[base_f:base_b] = pressed[nu:]
    pool[base_b:] = pressed[nu:]
    edge = attr.copy()
    edge[base_f:base_b] = brk[nu:]
    edge[base_b:] = brk[nu:]
    return {"verts": verts, "loops": loops, "sizes": sizes, "uv": uv, "attrs": {"pool": pool, "brk": edge}}


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
    mesh = build_logo()
    bad, vol = check(mesh)
    tris = int((mesh["sizes"] - 2).sum())
    print(f"with the logo: {len(mesh['verts'])} vertices, {tris} triangles; {bad} bad edges; volume {vol:.4f} R^3")
    print("extent", mesh["verts"].min(0).round(4), mesh["verts"].max(0).round(4))
