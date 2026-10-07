"""Trace the Beetle logo from a picture into a clean SVG.

The logo is drawn with a compass and a ruler: three shapes whose edges are
straight lines, circular arcs and elliptical arcs, meeting at small rounded tips
(and one sharp notch, where the two lobes of the long shape meet). The picture
of it has hard, stair-stepped edges, so tracing those pixel by pixel would keep
the stairs. Instead, this finds each edge, fits the true line, circle or ellipse
to it, finds the radius of each rounded tip, and draws the logo again from
those, exact at any size.

It then draws the SVG back over the picture to check it, and prints how far its
outline strays from the picture's on average.

    python trace_logo.py ../reference/beetle-logo.png ../reference/beetle-logo.svg
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, gaussian_filter1d
from scipy.optimize import least_squares
from skimage import measure

STEP = 0.5  # spacing of outline samples, in picture pixels
SMOOTH = 6.0  # pixels of smoothing before telling corners from edges
CORNER = 1.2  # degrees of turn per pixel above which the outline is a corner
TRIM = 10.0  # pixels left off each end of an edge before fitting it
MARGIN = 0.04  # of the logo's larger side, left clear round it in the SVG


# ------------------------------------------------------------------ reading the picture


def read(photo):
    rgb = np.asarray(Image.open(photo).convert("RGB")).astype(float)
    lum = rgb.mean(axis=2)
    paper, ink = np.percentile(lum, 95), np.percentile(lum, 2)
    inked = lum < (paper + ink) / 2
    ink_rgb = np.median(rgb[inked], axis=0)
    paper_rgb = np.median(rgb[lum > np.percentile(lum, 60)], axis=0)
    return inked, ink_rgb, paper_rgb


def outlines(inked):
    """Each shape's outline, y up, anticlockwise (so the ink is on the left),
    sampled every STEP pixels."""
    h = inked.shape[0]
    soft = gaussian_filter(inked.astype(float), 1.0)
    out = []
    for c in measure.find_contours(soft, 0.5):
        p = np.c_[c[:, 1], h - c[:, 0]]
        if len(p) < 50:
            continue
        seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
        s = np.r_[0, np.cumsum(seg)]
        t = np.arange(0, s[-1], STEP)
        q = np.c_[np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])]
        area = 0.5 * np.sum(q[:, 0] * np.roll(q[:, 1], -1) - np.roll(q[:, 0], -1) * q[:, 1])
        out.append(q if area > 0 else q[::-1])
    return out


def split(q):
    """Runs of edge and corner along an outline, as (is_corner, indices, turn in degrees)."""
    n = len(q)
    sigma = SMOOTH / STEP
    sm = np.c_[gaussian_filter1d(q[:, 0], sigma, mode="wrap"), gaussian_filter1d(q[:, 1], sigma, mode="wrap")]
    d = np.gradient(sm, axis=0)
    dd = np.gradient(d, axis=0)
    k = np.degrees((d[:, 0] * dd[:, 1] - d[:, 1] * dd[:, 0]) / np.linalg.norm(d, axis=1) ** 3)
    sharp = np.abs(k) > CORNER
    start = int(np.argmin(sharp))
    order = np.r_[start:n, 0:start]
    runs, b, cur = [], 0, sharp[order[0]]
    for j in range(1, n + 1):
        v = sharp[order[j % n]]
        if j == n or v != cur:
            runs.append((bool(cur), order[b:j], float(k[order[b:j]].sum())))
            b, cur = j, v
    return runs


# ------------------------------------------------------------------ edges


class Line:
    def __init__(self, pts):
        c = pts.mean(0)
        u = np.linalg.svd(pts - c)[2][0]
        if u @ (pts[-1] - pts[0]) < 0:
            u = -u
        self.p, self.u = c, u
        self.n = np.array([-u[1], u[0]])  # to the left: into the ink

    def sd(self, x):
        return (np.asarray(x) - self.p) @ self.n

    def project(self, x):
        return self.p + ((x - self.p) @ self.u) * self.u

    def rms(self, pts):
        return float(np.sqrt(np.mean(self.sd(pts) ** 2)))

    def describe(self):
        return f"line at {math.degrees(math.atan2(self.u[1], self.u[0])):.2f} deg"


class Circle:
    def __init__(self, pts):
        x, y = pts[:, 0], pts[:, 1]
        a = np.c_[2 * x, 2 * y, np.ones_like(x)]
        cx, cy, c = np.linalg.lstsq(a, x * x + y * y, rcond=None)[0]
        r = math.sqrt(c + cx * cx + cy * cy)
        fit = least_squares(lambda v: np.hypot(x - v[0], y - v[1]) - v[2], [cx, cy, r])
        self.o, self.r = fit.x[:2], fit.x[2]
        i = len(pts) // 2
        tangent = pts[i + 1] - pts[i - 1]
        left = np.array([-tangent[1], tangent[0]])
        self.inside = bool(left @ (self.o - pts[i]) > 0)  # is the ink on the centre's side?

    def sd(self, x):
        d = np.linalg.norm(np.atleast_2d(x) - self.o, axis=1)
        v = self.r - d if self.inside else d - self.r
        return v if np.ndim(x) > 1 else v[0]

    def project(self, x):
        v = x - self.o
        return self.o + v / np.linalg.norm(v) * self.r

    def rms(self, pts):
        return float(np.sqrt(np.mean(self.sd(pts) ** 2)))

    def describe(self):
        return f"arc r {self.r:.1f} ({'bulging' if self.inside else 'hollow'})"


class Ellipse:
    """An ellipse fitted to an edge that a circle does not follow. The logo's
    ellipses lie along its diagonal, so a fit within a degree and a half of it
    is set exactly on it."""

    def __init__(self, pts, circle):
        def resid(v):
            return self._signed(pts, v)

        best = None
        for th in np.linspace(0, math.pi, 8, endpoint=False):
            for ratio in (0.8, 1.25):
                f = least_squares(resid, [circle.o[0], circle.o[1], circle.r * ratio, circle.r / ratio, th])
                if best is None or f.cost < best.cost:
                    best = f
        cx, cy, a, b, th = best.x
        a, b = abs(a), abs(b)
        if a < b:
            a, b, th = b, a, th + math.pi / 2
        th %= math.pi
        diag = round(th / (math.pi / 4)) * (math.pi / 4)
        if abs(th - diag) < math.radians(1.5):
            f = least_squares(lambda v: self._signed(pts, [v[0], v[1], v[2], v[3], diag]), [cx, cy, a, b])
            cx, cy, a, b, th = *f.x, diag
        self.o, self.a, self.b, self.th = np.array([cx, cy]), a, b, th
        self.inside = circle.inside

    @staticmethod
    def _local(pts, v):
        cx, cy, a, b, th = v
        c, s = math.cos(th), math.sin(th)
        d = np.atleast_2d(pts) - [cx, cy]
        return d[:, 0] * c + d[:, 1] * s, -d[:, 0] * s + d[:, 1] * c

    @classmethod
    def _closest(cls, pts, v):
        """Parameter of the nearest point on the ellipse, by Newton's method."""
        x, y = cls._local(pts, v)
        a, b = v[2], v[3]
        t = np.arctan2(y / b, x / a)
        for _ in range(8):
            ex, ey = a * np.cos(t), b * np.sin(t)
            dx, dy = -a * np.sin(t), b * np.cos(t)
            g = (ex - x) * dx + (ey - y) * dy
            h = dx * dx + dy * dy + (ex - x) * (-a * np.cos(t)) + (ey - y) * (-b * np.sin(t))
            t = t - g / np.where(np.abs(h) < 1e-9, 1e-9, h)
        return t, x, y

    @classmethod
    def _signed(cls, pts, v):
        t, x, y = cls._closest(pts, v)
        a, b = v[2], v[3]
        dist = np.hypot(x - a * np.cos(t), y - b * np.sin(t))
        outside = (x / a) ** 2 + (y / b) ** 2 > 1
        return np.where(outside, dist, -dist)

    def v(self):
        return [self.o[0], self.o[1], self.a, self.b, self.th]

    def sd(self, x):
        out = self._signed(x, self.v())  # positive outside the ellipse
        out = -out if self.inside else out
        return out if np.ndim(x) > 1 else out[0]

    def point(self, t):
        c, s = math.cos(self.th), math.sin(self.th)
        ex, ey = self.a * np.cos(t), self.b * np.sin(t)
        return np.stack([self.o[0] + ex * c - ey * s, self.o[1] + ex * s + ey * c], -1)

    def param(self, x):
        return float(self._closest(x, self.v())[0][0])

    def project(self, x):
        return self.point(self.param(x))

    def rms(self, pts):
        return float(np.sqrt(np.mean(self.sd(pts) ** 2)))

    def describe(self):
        return f"ellipse {2 * self.a:.1f} x {2 * self.b:.1f} at {math.degrees(self.th):.1f} deg"


def fit_edge(pts):
    line, circle = Line(pts), Circle(pts)
    if circle.r > 4000 or line.rms(pts) < 1.15 * circle.rms(pts):
        return line
    if circle.rms(pts) > 0.45:
        ellipse = Ellipse(pts, circle)
        if ellipse.rms(pts) < 0.8 * circle.rms(pts):
            return ellipse
    return circle


# ------------------------------------------------------------------ corners


def meet(a, b, offset, near):
    """The point `offset` inside both edges (outside, if negative), near a point."""
    return least_squares(lambda c: [a.sd(c) - offset, b.sd(c) - offset], near).x


def angle(c, p):
    return math.atan2(p[1] - c[1], p[0] - c[0])


def best_fillet(a, b, pts, convex):
    """The radius whose round best follows the picture's tip: (radius, centre,
    where it leaves the first edge, where it joins the second)."""
    sign = 1 if convex else -1
    best = None
    for r in np.arange(1.0, 40.0, 0.25):
        c = meet(a, b, sign * r, pts.mean(0))
        ta, tb = a.project(c), b.project(c)
        a0 = angle(c, ta)
        span = (angle(c, tb) - a0) % (2 * math.pi) if convex else (a0 - angle(c, tb)) % (2 * math.pi)
        rel = np.array([(angle(c, p) - a0) % (2 * math.pi) if convex else (a0 - angle(c, p)) % (2 * math.pi) for p in pts])
        on = rel <= span
        if on.sum() < 4:
            continue
        err = np.abs(np.linalg.norm(pts[on] - c, axis=1) - r).mean()
        if best is None or err < best[0]:
            best = (err, r, c, ta, tb)
    return best[1:]


# ------------------------------------------------------------------ drawing


def build(q):
    """One shape as pieces, ('line', p, q) or ('arc', centre, r, p, q, anticlockwise),
    with the edges and tips it was built from."""
    runs = split(q)
    if not runs[0][0] and not runs[-1][0]:  # the same edge, cut where the outline was started
        runs[0] = (False, np.r_[runs[-1][1], runs[0][1]], runs[-1][2] + runs[0][2])
        runs.pop()
    while not runs[0][0]:  # start at a tip: tip, edge, tip, edge ...
        runs.append(runs.pop(0))
    trim = int(TRIM / STEP)
    tips = runs[0::2]
    edges = [fit_edge(q[idx[trim:-trim]] if len(idx) > 4 * trim else q[idx]) for _, idx, _ in runs[1::2]]

    joints = []  # joint i sits between edges[i - 1] and edges[i]
    for i, (_, idx, turn) in enumerate(tips):
        a, b = edges[i - 1], edges[i]
        pts = q[idx]
        if turn < -150:  # the notch: two edges meeting in a sharp point
            joints.append(("point", meet(a, b, 0.0, pts[np.argmin(np.linalg.norm(pts - pts.mean(0), axis=1))])))
        else:
            r, c, ta, tb = best_fillet(a, b, pts, convex=turn > 0)
            joints.append(("round", c, r, ta, tb, turn > 0))

    pieces = []
    for i, j in enumerate(joints):
        if j[0] == "round":
            pieces.append(("arc", j[1], j[2], j[3], j[4], j[5]))
        start = j[1] if j[0] == "point" else j[4]
        nxt = joints[(i + 1) % len(joints)]
        end = nxt[1] if nxt[0] == "point" else nxt[3]
        e = edges[i]
        if isinstance(e, Line):
            pieces.append(("line", start, end))
        elif isinstance(e, Ellipse):
            pieces.append(("ellipse", e, start, end))
        else:
            pieces.append(("arc", e.o, e.r, start, end, e.inside))
    return pieces, edges, joints


def sweep(c, p, q, ccw):
    a0, a1 = angle(c, p), angle(c, q)
    return (a1 - a0) % (2 * math.pi) if ccw else -((a0 - a1) % (2 * math.pi))


def ellipse_sweep(e, p, q):
    t0, t1 = e.param(p), e.param(q)
    return t0, ((t1 - t0) % (2 * math.pi) if e.inside else -((t0 - t1) % (2 * math.pi)))


def flatten(pieces, step=0.5):
    pts = []
    for pc in pieces:
        if pc[0] == "line":
            pts += [pc[1], pc[2]]
        elif pc[0] == "ellipse":
            _, e, p, q = pc
            t0, sw = ellipse_sweep(e, p, q)
            n = max(2, int(abs(sw) * e.a / step))
            pts += list(e.point(t0 + sw * np.linspace(0, 1, n)))
        else:
            _, c, r, p, q, ccw = pc
            a0, sw = angle(c, p), sweep(c, p, q, ccw)
            n = max(2, int(abs(sw) * r / step))
            pts += [c + r * np.array([math.cos(a0 + sw * t), math.sin(a0 + sw * t)]) for t in np.linspace(0, 1, n)]
    return np.array(pts)


def start_of(pc):
    return pc[{"line": 1, "ellipse": 2, "arc": 3}[pc[0]]]


def main(photo, out):
    inked, ink_rgb, paper_rgb = read(photo)
    H, W = inked.shape
    shapes = [build(q) for q in outlines(inked)]

    allpts = np.vstack([flatten(s[0]) for s in shapes])
    lo, hi = allpts.min(0), allpts.max(0)
    pad = MARGIN * (hi - lo).max()
    left, top = lo[0] - pad, hi[1] + pad  # y is up in here and down in the SVG
    w, h = hi[0] - lo[0] + 2 * pad, hi[1] - lo[1] + 2 * pad

    def xy(p):
        return f"{p[0] - left:.3f} {top - p[1]:.3f}"

    paths = []
    for pieces, _, _ in shapes:
        cmd = [f"M{xy(start_of(pieces[0]))}"]
        for pc in pieces:
            if pc[0] == "line":
                cmd.append(f"L{xy(pc[2])}")
            elif pc[0] == "ellipse":
                _, e, p, q = pc
                _, sw = ellipse_sweep(e, p, q)
                rot = -math.degrees(e.th)  # y flips on the way out
                cmd.append(f"A{e.a:.3f} {e.b:.3f} {rot:.3f} {1 if abs(sw) > math.pi else 0} {0 if e.inside else 1} {xy(q)}")
            else:
                _, c, r, p, q, ccw = pc
                sw = sweep(c, p, q, ccw)
                # y flips on the way out, so anticlockwise here is SVG's sweep-flag 0
                cmd.append(f"A{r:.3f} {r:.3f} 0 {1 if abs(sw) > math.pi else 0} {0 if ccw else 1} {xy(q)}")
        paths.append(" ".join(cmd) + " Z")
    ink_hex = "#%02x%02x%02x" % tuple(int(round(v)) for v in ink_rgb)
    paper_hex = "#%02x%02x%02x" % tuple(int(round(v)) for v in paper_rgb)
    with open(out, "w") as fh:
        fh.write(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.3f} {h:.3f}" width="{w:.0f}" height="{h:.0f}">\n'
            f"  <title>Beetle</title>\n"
            f"  <!-- Rebuilt from {photo.split('/')[-1]} as lines, circles and ellipses. Ink {ink_hex}; it sits on {paper_hex}. -->\n"
            + "".join(f'  <path fill="{ink_hex}" d="{p}"/>\n' for p in paths)
            + "</svg>\n"
        )

    for n, (pieces, edges, joints) in enumerate(shapes):
        print(f"shape {n + 1}: " + "; ".join(e.describe() for e in edges))
        print("   tips: " + ", ".join("sharp" if j[0] == "point" else f"r {j[2]:.2f}" for j in joints))

    # Draw it back over the picture and see how far apart they are.
    ss = 4
    canvas = Image.new("L", (W * ss, H * ss), 0)
    draw = ImageDraw.Draw(canvas)
    for pieces, _, _ in shapes:
        # outline samples sit on pixel centres; in the drawing a pixel's centre is half a pixel in
        draw.polygon([((p[0] + 0.5) * ss, (H - p[1] + 0.5) * ss) for p in flatten(pieces, 0.25)], fill=255)
    drawn = np.asarray(canvas, float).reshape(H, ss, W, ss).mean(axis=(1, 3)) / 255
    stray = np.abs(drawn - inked).sum()
    edge = sum(np.linalg.norm(np.diff(flatten(s[0]), axis=0), axis=1).sum() for s in shapes)
    print(f"viewBox {w:.1f} x {h:.1f}; the outline strays {stray / edge:.2f} px from the picture's on average")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
