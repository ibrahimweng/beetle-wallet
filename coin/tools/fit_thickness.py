"""Find the coin's thickness from the angled photograph.

The front photo fixes everything across the face; only the thickness is hidden.
The angled photo shows it, but foreshortened by an unknown camera. So this puts
the model in front of a pinhole camera and searches for the camera's angle,
distance and framing together with the thickness and the hole's sideways
position, until the model's silhouette (its outline, and the daylight through
the hole) covers the photo's as closely as it can.

The silhouette is drawn directly rather than rendered: the outline is the hull
of the rim, and light gets through the hole wherever a ray clears every slice
of the hole wall and lip.

    python fit_thickness.py ../reference/angle.png
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import minimize
from scipy.spatial import ConvexHull

import coin_geometry as geo

SS = 3  # supersampling


def rot(yaw, pitch, roll):
    cy, sy, cp, sp, cr, sr = map(float, (np.cos(yaw), np.sin(yaw), np.cos(pitch), np.sin(pitch), np.cos(roll), np.sin(roll)))
    ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    return rz @ ry @ rx


class Model:
    def __init__(self, params):
        self.params = params
        _, self.hp, self.hn = geo._sample_around(dict(params, around=240, hole_shift=(0.0, 0.0)))
        prof = geo.revolved_profile(params)
        a = np.linspace(0, 2 * math.pi, 240, endpoint=False)
        circ = np.c_[np.cos(a), np.sin(a)]
        pts = [np.c_[circ * r, np.full(len(a), s * z)] for r, z in prof for s in (1, -1)]
        self.rim = np.vstack(pts)

    def hole_slices(self, kz, shift):
        p = self.params
        a, b = p["lip_width"], p["lip_height"]
        t_end, _, h_end = geo.lip_end(p)
        z_wall = p["lip_top"] - h_end
        out = []
        for z in np.linspace(0, z_wall, 3):
            out.append((self.hp, z))
        for t in np.linspace(0, min(t_end, math.pi / 2), 7)[1:]:
            out.append((self.hp + self.hn * a * (1 - math.cos(t)), z_wall + b * math.sin(t)))
        res = []
        for xy, z in out:
            xy = xy + shift
            for s in (1, -1):
                res.append(np.c_[xy, np.full(len(xy), s * z * kz)])
        return res


def project(points, x):
    yaw, pitch, roll, dist, scale, cx, cy = x[:7]
    p = points @ rot(yaw, pitch, roll).T
    w = dist / (dist - p[:, 2])
    return np.c_[cx + scale * p[:, 0] * w, cy - scale * p[:, 1] * w] * SS


def silhouette(model, x, size):
    kz, dx = x[7], x[8]
    big = (size[0] * SS, size[1] * SS)
    rim = model.rim * np.array([1, 1, kz])
    pr = project(rim, x)
    hull = pr[ConvexHull(pr).vertices]
    outer = Image.new("L", big, 0)
    ImageDraw.Draw(outer).polygon([tuple(q) for q in hull], fill=255)
    through = None
    for ring in model.hole_slices(kz, np.array([dx, 0.0])):
        img = Image.new("L", big, 0)
        ImageDraw.Draw(img).polygon([tuple(q) for q in project(ring, x)], fill=255)
        m = np.asarray(img) > 0
        through = m if through is None else through & m
    sil = (np.asarray(outer) > 0) & ~through
    return sil.reshape(size[1], SS, size[0], SS).mean(axis=(1, 3))


def main(photo):
    alpha = np.asarray(Image.open(photo).convert("RGBA"))[..., 3] / 255.0
    size = (alpha.shape[1], alpha.shape[0])
    model = Model(geo.PARAMS)

    def loss(x):
        if x[7] <= 0.3 or x[3] < 3:
            return 1.0
        return float(np.abs(silhouette(model, x, size) - alpha).mean())

    ys, xs = np.nonzero(alpha > 0.5)
    base = np.array([-0.89, 0.0, 0.03, 16.0, (ys.max() - ys.min()) / 2, xs.mean(), ys.mean(), 1.0, 0.0])
    best = None
    for kz in (1.0, 1.3):
        for dx in (0.0, -0.025):
            x = base.copy()
            x[7], x[8] = kz, dx
            step = np.array([0.05, 0.03, 0.03, 4.0, 5.0, 3.0, 3.0, 0.1, 0.02])
            simplex = np.vstack([x] + [x + np.eye(9)[i] * step[i] for i in range(9)])
            r = minimize(loss, x, method="Nelder-Mead", options=dict(maxiter=1500, xatol=1e-5, fatol=1e-7, initial_simplex=simplex))
            r = minimize(loss, r.x, method="Powell", options=dict(maxiter=1500, xtol=1e-4, ftol=1e-7))
            print(f"from thickness x{kz} shift {dx:+.2f}: error {r.fun:.5f}  thickness x{r.x[7]:.3f}  shift {r.x[8]:+.4f}  yaw {np.degrees(r.x[0]):.1f}  camera {r.x[3]:.1f}R", flush=True)
            if best is None or r.fun < best.fun:
                best = r
    x = best.x
    rim_z = max(z for _, z, _ in geo.PARAMS["profile"])
    print("best: error %.5f" % best.fun)
    print("  yaw %.2f, pitch %.2f, roll %.2f degrees; camera %.1f R away" % (*np.degrees(x[:3]), x[3]))
    print("  thickness x%.3f -> %.3f R rim to rim (%.1f%% of the diameter)" % (x[7], 2 * rim_z * x[7], 100 * rim_z * x[7]))
    print("  hole shifted %+.4f R sideways" % x[8])
    # grey: both; red: photo only; blue: model only
    m = silhouette(model, x, size) > 0.5
    t = alpha > 0.5
    out = np.zeros(t.shape + (3,), np.uint8)
    out[t & m] = (200, 200, 200)
    out[t & ~m] = (220, 60, 60)
    out[~t & m] = (60, 120, 230)
    here = os.path.dirname(os.path.abspath(__file__))
    Image.fromarray(out).resize((size[0] * 2, size[1] * 2), Image.NEAREST).save(os.path.join(here, "..", "previews", "angle_fit.png"))
    names = ["yaw", "pitch", "roll", "distance", "scale", "cx", "cy", "thickness", "hole_shift_x"]
    with open(os.path.join(here, "fit_camera.json"), "w") as f:
        json.dump({"about": "The camera fit_thickness.py found for reference/angle.png. Angles in radians, "
                   "distance in coin radii, scale and centre in photo pixels.", "error": round(float(best.fun), 5),
                   **{k: round(float(v), 6) for k, v in zip(names, x)}}, f, indent=1)


if __name__ == "__main__":
    main(sys.argv[1])
