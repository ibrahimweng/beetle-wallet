/* The light at the card's edge (Round 21, after Apple's NameDrop; made
   quieter in Round 24, the owner's word: the card's own border glowing
   softly, no streaks and no light at the foot, the aberration kept).

   Pulled down, the black card's border lights up from inside: a fine line
   of light just in from its edge, its outer side warm and its inner side
   cool, softly, with a faint glow inward from it. It is strongest along the
   rounded bottom, where the finger pulls, and thins out up the sides. It
   grows with the pull and is whole at the point where the card opens; there
   the card goes on by itself, finger down or not, and the border swells
   once, softly, then fades as the chat settles. No ring, no flash. Closing,
   a quieter glow rises along the border and is gone before it shuts.

   This is the arithmetic of it, the same on the phone (Skia) and on the web
   (WebGL): how much light a pull has gathered, when the phone knocks, the
   glow as it closes, and the shader that draws it all. */

/** How far open the pulled card is when it goes on by itself, and the border swells: where letting go has always opened it. */
export const GATHER = 0.35;
/** How long the swell and its fade run, in seconds. */
export const PULSE = 0.9;
/** The card's bottom corners, as the card draws them. */
export const RADIUS = 36;

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

/** The knocks a pull has earned, 0 to 3: one a quarter of the way to opening, then two more, the swell being the fourth. */
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

/** What the shader is handed: the card's width and where its edge is, how much light, the swell's clock, and the closing glow. */
export type GlowUniforms = { size: number[]; a: number; t: number; g: number };

/** The uniforms for a card of this width whose bottom edge is at `edge` (its height). */
export const uniformsOf = (s: { width: number; edge: number; a: number; t: number; g: number }): GlowUniforms => {
  'worklet';
  return { size: [s.width, s.edge], a: s.a, t: s.t, g: s.g };
};

/** Is there anything to draw? */
export const lit = (u: GlowUniforms) => {
  'worklet';
  return u.a > 0.001 || u.g > 0.001 || (u.t >= 0 && u.t < PULSE);
};

/* The shader, in the words Skia's SkSL and WebGL's GLSL share. `p` is the
   point in the card, in points from its top left. */
const BODY = `
/* how far in from the card's outline a point is: its two sides and its rounded bottom (the top runs on, above the screen) */
float inside(vec2 p) {
  float R = ${RADIUS.toFixed(1)};
  vec2 c = vec2(size.x * 0.5, (size.y - 4000.0) * 0.5);
  vec2 b = vec2(size.x * 0.5, (size.y + 4000.0) * 0.5);
  vec2 q = abs(p - c) - b + R;
  return -(length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - R);
}
float band(float k, float c, float w) {
  float x = (k - c) / w;
  return exp(-x * x);
}
/* the rim: a fine line of light just in from the edge, its outer side warm and its inner side cool, softly, and a
   faint glow inward from it */
vec3 rim(float d, float e) {
  float s = 0.6 + 0.6 * e;
  float c0 = 2.4;
  vec3 split = vec3(band(d, c0 - s, 1.6), band(d, c0, 1.6), band(d, c0 + s, 1.6));
  vec3 line = mix(vec3(band(d, c0, 1.9)), split, 0.8);
  vec3 soft = vec3(exp(-d / 14.0), exp(-d / 16.0), exp(-d / 19.0));
  return line * 0.62 + soft * 0.2;
}
vec3 light(vec2 p) {
  float d = inside(p);
  if (d < 0.0) return vec3(0.0);
  /* strongest along the bottom curve, thinning out up the sides */
  float up = clamp(p.y / max(size.y, 1.0), 0.0, 1.0);
  float along = pow(up * up * (3.0 - 2.0 * up), 1.7);
  float e = a;
  if (t >= 0.0) {
    /* one soft swell as the card goes on, then gone */
    float swell = sin(3.14159265 * clamp(t / 0.34, 0.0, 1.0));
    e = a * (1.0 + 0.55 * swell) * (1.0 - smoothstep(0.14, ${PULSE.toFixed(2)}, t));
  }
  e += g * 0.6;
  if (e < 0.001) return vec3(0.0);
  return clamp(rim(d, min(e, 1.0)) * e * along, 0.0, 1.0);
}
`;

const UNIFORMS = `
uniform vec2 size;
uniform float a;
uniform float t;
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
