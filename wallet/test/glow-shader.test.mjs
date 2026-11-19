/* The light's shader (see home/glow), compiled and drawn by Skia's own
   CanvasKit, what Skia brings for the web, so a shader the phone could not
   compile never ships: at rest it draws nothing; pulled, the card's border
   lights from inside, strongest along the bottom and thinning up the sides,
   in the Border beam's colours riding round it (Round 44), and nothing in the middle of
   the card or outside it (Round 24: no streaks, no light at the foot, no
   ring); the swell brightens it once and is gone. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { PULSE, SKSL, uniformsOf } from '../src/features/home/glow';

describe('the shader', () => {
  const skia = createRequire(createRequire(import.meta.url).resolve('@shopify/react-native-skia/package.json'));
  const dir = skia.resolve('canvaskit-wasm/bin/full/canvaskit.js').replace(/canvaskit\.js$/, '');
  let CK;
  beforeAll(async () => {
    const init = skia('canvaskit-wasm/bin/full/canvaskit.js');
    CK = await init({ locateFile: f => dir + f });
  });
  const W = 160;
  const H = 320;
  /* draws one frame and gives each pixel, unpremultiplied as far as it matters: [r, g, b, a] */
  const draw = u => {
    let err = '';
    const fx = CK.RuntimeEffect.Make(SKSL, e => (err += e));
    expect(err).toBe('');
    const names = Array.from({ length: fx.getUniformCount() }, (_, i) => fx.getUniformName(i));
    const values = names.flatMap(n => u[n]);
    const surface = CK.MakeSurface(W, H);
    const paint = new CK.Paint();
    paint.setShader(fx.makeShader(values));
    surface.getCanvas().drawRect(CK.LTRBRect(0, 0, W, H), paint);
    const px = surface.getCanvas().readPixels(0, 0, { width: W, height: H, colorType: CK.ColorType.RGBA_8888, alphaType: CK.AlphaType.Premul, colorSpace: CK.ColorSpace.SRGB });
    surface.delete();
    return (x, y) => Array.from(px.slice((y * W + x) * 4, (y * W + x) * 4 + 4));
  };
  const alphaIn = (px, x0, x1, y0, y1) => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) n += px(x, y)[3];
    return n;
  };
  const E = 260;

  it('compiles for Skia, with the uniforms it is handed', () => {
    let err = '';
    const fx = CK.RuntimeEffect.Make(SKSL, e => (err += e));
    expect(err).toBe('');
    expect(Array.from({ length: fx.getUniformCount() }, (_, i) => fx.getUniformName(i)).sort()).toEqual(['a', 'g', 'size', 't']);
  });
  it('draws nothing at rest', () => {
    const px = draw(uniformsOf({ width: W, edge: E, a: 0, t: -1, g: 0 }));
    expect(alphaIn(px, 0, W, 0, H)).toBe(0);
  });
  it('lights the border from inside, strongest along the bottom, and nothing in the middle or below the card', () => {
    const px = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    /* the rim just in from the bottom edge, in the middle of it */
    expect(px(W / 2, E - 3)[3]).toBeGreaterThan(100);
    /* the middle of the card stays dark: no bow, no streaks */
    expect(px(W / 2, E - 70)[3]).toBeLessThan(6);
    /* below the card, nothing */
    expect(alphaIn(px, 0, W, E + 1, H)).toBe(0);
    /* the sides light near the bottom and thin out going up */
    expect(px(2, E - 60)[3]).toBeGreaterThan(px(2, 40)[3] * 4);
  });
  it("is the beam's colourful light, its colours changing along the edge and riding round it as the card comes down", () => {
    const hue = ([r, g, b]) => Math.round((Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI);
    const near = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    /* the bottom of the edge and its side are different colours */
    const bottom = near(W / 2, E - 3);
    const side = near(3, E - 70);
    expect(Math.abs(hue(bottom) - hue(side))).toBeGreaterThan(20);
    /* the same spot is another colour once the card has come further down */
    const further = draw(uniformsOf({ width: W, edge: E + 40, a: 1, t: -1, g: 0 }));
    expect(Math.abs(hue(further(W / 2, E + 37)) - hue(bottom))).toBeGreaterThan(10);
  });
  it('breathes in from the edge as the card goes on: its glow reaches further in', () => {
    const held = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    const breath = draw(uniformsOf({ width: W, edge: E, a: 1, t: 0.25, g: 0 }));
    expect(alphaIn(breath, 0, W, E - 60, E - 30)).toBeGreaterThan(alphaIn(held, 0, W, E - 60, E - 30) * 1.5);
  });
  it('swells once as the card goes on, then is gone', () => {
    const held = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    const swell = draw(uniformsOf({ width: W, edge: E, a: 1, t: 0.17, g: 0 }));
    const late = draw(uniformsOf({ width: W, edge: E, a: 1, t: PULSE - 0.02, g: 0 }));
    expect(alphaIn(swell, 0, W, E - 30, E)).toBeGreaterThan(alphaIn(held, 0, W, E - 30, E));
    expect(alphaIn(late, 0, W, E - 30, E)).toBeLessThan(alphaIn(held, 0, W, E - 30, E) * 0.1);
  });
});
