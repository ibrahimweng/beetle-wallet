/* The light's shader (Round 21, see home/glow), compiled and drawn by
   Skia's own CanvasKit, what Skia brings for the web, so a shader the phone
   could not compile never ships: at rest it draws nothing, a pull gathers
   its light at the card's edge, and a pulse runs a ring out from where it
   fired. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { SKSL, reachOf, uniformsOf } from '../src/features/home/glow';

describe('the shader', () => {
  const skia = createRequire(createRequire(import.meta.url).resolve('@shopify/react-native-skia/package.json'));
  const dir = skia.resolve('canvaskit-wasm/bin/full/canvaskit.js').replace(/canvaskit\.js$/, '');
  let CK;
  beforeAll(async () => {
    const init = skia('canvaskit-wasm/bin/full/canvaskit.js');
    CK = await init({ locateFile: f => dir + f });
  });
  const W = 120;
  const H = 300;
  /* draws one frame and gives each pixel's alpha */
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
    return (x, y) => px[(y * W + x) * 4 + 3];
  };
  /* how much light there is in a band of rows */
  const rows = (alpha, y0, y1) => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) n += alpha(x, y);
    return n;
  };

  it('compiles for Skia, with the uniforms it is handed', () => {
    let err = '';
    const fx = CK.RuntimeEffect.Make(SKSL, e => (err += e));
    expect(err).toBe('');
    expect(Array.from({ length: fx.getUniformCount() }, (_, i) => fx.getUniformName(i)).sort()).toEqual(['a', 'g', 'o', 'po', 'reach', 't']);
  });
  it('draws nothing at rest', () => {
    const alpha = draw(uniformsOf({ width: W, height: H, edge: 200, a: 0, at: 0, t: -1, g: 0 }));
    expect(rows(alpha, 0, H)).toBe(0);
  });
  it('gathers the light at the edge being pulled, not at the top', () => {
    const alpha = draw(uniformsOf({ width: W, height: H, edge: 200, a: 1, at: 0, t: -1, g: 0 }));
    expect(rows(alpha, 150, 200)).toBeGreaterThan(rows(alpha, 0, 50) * 4);
    expect(alpha(W / 2, 194)).toBeGreaterThan(100);
  });
  it('pulses a ring out from where it fired', () => {
    /* a third of a second in, the ring has run most of the way up from the edge */
    const alpha = draw(uniformsOf({ width: W, height: H, edge: 290, a: 0, at: 200, t: 0.3, g: 0 }));
    const reach = reachOf(W, H, 200);
    const rho = reach * (1 - Math.pow(1 - 0.3 / 0.62, 2.4));
    const y = Math.round(200 - 6 - rho);
    expect(y).toBeGreaterThan(5);
    expect(alpha(W / 2, y)).toBeGreaterThan(alpha(W / 2, y + 40));
  });
});
