"""Read the hole's outline off the front photograph.

The photo is a cut-out with a transparent background, so the coin's edge and
the hole are both just where the alpha channel crosses one half. The outer edge
gives the coin's centre and radius; the hole is then written out in units of
that radius, y up, mirrored left to right and averaged so the two halves agree,
and centred left to right (the photo has it 0.026 R left of centre, which is the
hand, not the design).

    python measure_hole.py ../reference/front.png hole_outline.json
"""
import json
import sys

import numpy as np
from PIL import Image
from skimage import measure


def fit_circle(x, y):
    a = np.c_[2 * x, 2 * y, np.ones_like(x)]
    cx, cy, c = np.linalg.lstsq(a, x * x + y * y, rcond=None)[0]
    return cx, cy, np.sqrt(c + cx * cx + cy * cy)


def main(photo, out):
    alpha = np.asarray(Image.open(photo).convert("RGBA"))[..., 3] / 255.0
    contours = sorted(measure.find_contours(alpha, 0.5), key=len, reverse=True)
    outer, hole = contours[0], contours[1]
    cx, cy, radius = fit_circle(outer[:, 1], outer[:, 0])

    x = (hole[:, 1] - cx) / radius
    y = -(hole[:, 0] - cy) / radius
    x -= (x.max() + x.min()) / 2

    # The hole is star-shaped about the coin's centre, so it is a radius for
    # each angle. Average each angle with its mirror image.
    theta = np.arctan2(y, x)
    r = np.hypot(x, y)
    order = np.argsort(theta)
    theta, r = theta[order], r[order]

    def r_at(t):
        t = (t + np.pi) % (2 * np.pi) - np.pi
        return np.interp(t, theta, r, period=2 * np.pi)

    angles = np.deg2rad(np.arange(-90.0, 90.0 + 1e-9, 0.25))
    sym = 0.5 * (r_at(angles) + r_at(np.pi - angles))
    right = np.c_[sym * np.cos(angles), sym * np.sin(angles)]

    points = ",\n  ".join(f"[{a:.5f}, {b:.5f}]" for a, b in right)
    with open(out, "w") as f:
        f.write(
            "{\n"
            '"about": "Right half of the hole, bottom to top, in units of the coin\'s radius, y up. '
            'Mirror it for the left half. Measured from reference/front.png.",\n'
            f'"photo_circle_px": {{"cx": {cx:.3f}, "cy": {cy:.3f}, "r": {radius:.3f}}},\n'
            f'"right_half": [\n  {points}\n]\n}}\n'
        )
    print(f"coin r={radius:.2f}px  hole x {x.min():.4f}..{x.max():.4f}  y {y.min():.4f}..{y.max():.4f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
