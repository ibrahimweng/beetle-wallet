/* The light at the card's edge (Round 21, the owner's word, after Apple's
   NameDrop: as two phones meet, light gathers in a soft streaked arc, pulses
   as they connect, and dies down the screen).

   Pulled down, the black card gathers light along its edge, where the
   finger is pulling: a soft bow of white rising from the middle of the edge,
   streaked, its rim split warm outside and cool inside. It grows with the
   pull and is whole at the point where the card opens; there the card goes
   on by itself, finger down or not, and the light pulses: a flash where it
   gathered, a fringed ring and a fainter echo running out from it through
   the opening chat, the bow riding the edge down to the foot as it dies.
   Closing, a quieter glow rises along the edge and is gone before it shuts.

   This is the arithmetic of it, the same on the phone (Skia) and on the web
   (WebGL): how much light a pull has gathered, when the phone knocks, the
   glow as it closes, and the shader that draws it all. */

/** How far open the pulled card is when it goes on by itself, and the light pulses: where letting go has always opened it. */
export const GATHER = 0.35;
/** How long the pulse runs, in seconds: the flash, the ring and its echo, and the bow dying at the foot. */
export const PULSE = 1.4;
/** The light's source sits this far above the card's edge, round the grabber. */
export const LIFT = 6;

const unit = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

/** The light a pull has gathered, from the card's openness: none at rest, all of it where the card goes on by itself, easing in and out. */
export const gathered = (p: number) => {
  'worklet';
  const x = unit(p / GATHER);
  return x * x * (3 - 2 * x);
};

/** The knocks a pull has earned, 0 to 3: one a quarter of the way to opening, then two more, the pulse being the fourth. */
export const knocks = (p: number) => {
  'worklet';
  return Math.min(3, Math.floor(unit(p / GATHER) * 4));
};

/** The quiet glow as an open card closes, from its openness: none while open, rising, and gone again before it shuts. */
export const closingGlow = (p: number) => {
  'worklet';
  const x = unit(p);
  return 4 * x * (1 - x);
};

/** How far the ring runs before it has died: past the farthest corner of the open card from where it fired. */
export const reachOf = (width: number, height: number, at: number) => {
  'worklet';
  return Math.hypot(width / 2, Math.max(at, height - at)) * 1.1;
};

/** What the shader is handed: where the light is, how much of it, and the pulse's clock. */
export type GlowUniforms = { o: number[]; a: number; po: number[]; t: number; reach: number; g: number };

/** The uniforms for a card of this width whose edge is at `edge` (its height), the pulse's layer `height` tall. */
export const uniformsOf = (s: { width: number; height: number; edge: number; a: number; at: number; t: number; g: number }): GlowUniforms => {
  'worklet';
  return {
    o: [s.width / 2, s.edge - LIFT],
    a: s.a,
    po: [s.width / 2, s.at - LIFT],
    t: s.t,
    reach: reachOf(s.width, s.height, s.at),
    g: s.g,
  };
};

/** Is there anything to draw? */
export const lit = (u: GlowUniforms) => {
  'worklet';
  return u.a > 0.001 || u.g > 0.001 || (u.t >= 0 && u.t < PULSE);
};

/* The shader, in the words Skia's SkSL and WebGL's GLSL share. `p` is the
   point in the card, in points from its top left. */
const BODY = `
const vec3 WARM = vec3(1.0, 0.95, 0.88);

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}
/* streaks: light and dark by the angle from the source */
float rays(float th) {
  float n = vnoise(th * 26.0) * 0.6 + vnoise(th * 61.0 + 13.0) * 0.4;
  return n * n;
}
float band(float k, float c, float w) {
  float x = (k - c) / w;
  return exp(-x * x);
}

/* the bow: a soft arc of light rising from the source, streaked, its rim split warm outside and cool inside */
vec3 bow(vec2 d, float e, float streaks) {
  vec2 rad = vec2(mix(140.0, 250.0, e), mix(16.0, 104.0, e));
  float k = length(d / rad);
  float r = length(d);
  float th = atan(d.x, 0.0001 - d.y);
  float q = 0.01;
  vec3 grain = vec3(rays(th + q), rays(th), rays(th - q));
  vec3 streak = mix(vec3(1.0), 0.65 + 0.7 * grain, streaks);
  float s = 0.07 + 0.05 * e;
  vec3 rim = vec3(band(k, 1.0 + s, 0.3), band(k, 1.0, 0.3), band(k, 1.0 - s, 0.3));
  vec3 c = rim * streak * 0.75 * e;
  c += WARM * exp(-k * k * 3.0) * 0.4 * e;
  float past = max(k - 1.0, 0.0);
  c += grain * grain * exp(-past / mix(0.4, 1.3, e)) * smoothstep(0.0, 0.4, -d.y / max(r, 1.0)) * 0.22 * e * streaks;
  return c;
}

/* a ring of the pulse, its edges split, f strong */
vec3 ring(float r, float rho, float w, float s, float f) {
  return vec3(band(r, rho + s, w), band(r, rho, w), band(r, rho - s, w)) * f;
}

vec3 light(vec2 p) {
  vec3 c = vec3(0.0);
  float e = a;
  if (t >= 0.0) e = a * exp(-t * 3.0);
  if (e > 0.001) c += bow(p - o, e, 1.0);
  if (g > 0.001) c += bow(p - o, g * 0.55, 0.3);
  if (t >= 0.0 && t < ${PULSE.toFixed(2)}) {
    float r = length(p - po);
    float T = 0.62;
    float u = clamp(t / T, 0.0, 1.0);
    float rho = reach * (1.0 - pow(1.0 - u, 2.4));
    float f = pow(1.0 - u, 1.3);
    float s = mix(2.0, 10.0, u);
    c += ring(r, rho, mix(8.0, 26.0, u), s, f);
    /* the wake under the ring */
    c += WARM * (1.0 - smoothstep(rho - 220.0, rho + 10.0, r)) * smoothstep(rho - 600.0, rho - 220.0, r) * 0.16 * f;
    /* the echo, a beat behind */
    float t2 = t - 0.085;
    if (t2 > 0.0) {
      float u2 = clamp(t2 / T, 0.0, 1.0);
      c += ring(r, reach * (1.0 - pow(1.0 - u2, 2.4)), mix(6.0, 20.0, u2), s, pow(1.0 - u2, 1.6) * 0.45);
    }
    /* the flash where it gathered */
    float sg = mix(50.0, 240.0, clamp(t / 0.35, 0.0, 1.0));
    c += WARM * exp(-t * 6.0) * exp(-r * r / (2.0 * sg * sg));
  }
  return clamp(c, 0.0, 1.0);
}
`;

const UNIFORMS = `
uniform vec2 o;
uniform float a;
uniform vec2 po;
uniform float t;
uniform float reach;
uniform float g;
`;

/** For Skia: the colour is the light, its alpha as much as its brightest part, so it lies over the card as light does. */
export const SKSL = `${UNIFORMS}${BODY}
half4 main(float2 p) {
  vec3 c = light(p);
  return half4(c, max(c.r, max(c.g, c.b)));
}
`;

/** For WebGL: the same, the point read off the pixel and the canvas's scale. */
export const GLSL = `precision highp float;
uniform vec2 res;
uniform float dpr;
${UNIFORMS}${BODY}
void main() {
  vec3 c = light(vec2(gl_FragCoord.x, res.y * dpr - gl_FragCoord.y) / dpr);
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}
`;
