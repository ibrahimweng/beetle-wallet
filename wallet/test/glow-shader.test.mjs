/* The light's shader (see home/glow), compiled and drawn by Skia's own
   CanvasKit, what Skia brings for the web, so a shader the phone could not
   compile never ships: at rest it draws nothing; pulled, the card's border
   lights from inside, strongest along the bottom and thinning up the sides,
   its outer side warm and its inner side cool, and nothing in the middle of
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
  it('splits the rim softly: warm on its outer side, cool on its inner', () => {
    const px = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    const outer = px(W / 2, E - 1);
    const inner = px(W / 2, E - 5);
    expect(outer[0]).toBeGreaterThan(outer[2]);
    expect(inner[2]).toBeGreaterThan(inner[0]);
  });
  it('swells once as the card goes on, then is gone', () => {
    const held = draw(uniformsOf({ width: W, edge: E, a: 1, t: -1, g: 0 }));
    const swell = draw(uniformsOf({ width: W, edge: E, a: 1, t: 0.17, g: 0 }));
    const late = draw(uniformsOf({ width: W, edge: E, a: 1, t: PULSE - 0.02, g: 0 }));
    expect(alphaIn(swell, 0, W, E - 30, E)).toBeGreaterThan(alphaIn(held, 0, W, E - 30, E));
    expect(alphaIn(late, 0, W, E - 30, E)).toBeLessThan(alphaIn(held, 0, W, E - 30, E) * 0.1);
  });
});
