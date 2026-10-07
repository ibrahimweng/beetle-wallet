/* The light at the card's border, on the web (Round 21, made a soft border
   glow in Round 24; what it draws is glow's): the same shader in WebGL, on a canvas over the card, drawn a
   frame at a time only while there is light, and hidden the rest of the
   time. A browser without WebGL draws nothing, and the card opens as it
   did. */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { GLSL, lit, type GlowUniforms } from './glow';
import type { LightProps } from './Light';

/* Soft light needs few pixels: it is drawn at half the page's own and
   stretched to fit, and at a quarter where the browser draws without a
   graphics chip, which would otherwise hold the finger up while it draws. */
const SCALE = 0.5;
const SCALE_SOFTWARE = 0.25;

type Painter = { draw: (u: GlowUniforms, width: number, height: number) => void; clear: () => void };

/** The shader on a canvas, or nothing where it cannot be had. */
function painterFor(canvas: HTMLCanvasElement): Painter | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  const k = /swiftshader|llvmpipe|software/i.test(renderer) ? SCALE_SOFTWARE : SCALE;
  const shader = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(`The card's light did not compile: ${gl.getShaderInfoLog(sh)}`);
      return null;
    }
    return sh;
  };
  const vs = shader(gl.VERTEX_SHADER, 'attribute vec2 q; void main() { gl_Position = vec4(q, 0.0, 1.0); }');
  const fs = shader(gl.FRAGMENT_SHADER, GLSL);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(`The card's light did not link: ${gl.getProgramInfoLog(prog)}`);
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const q = gl.getAttribLocation(prog, 'q');
  gl.enableVertexAttribArray(q);
  gl.vertexAttribPointer(q, 2, gl.FLOAT, false, 0, 0);
  const at = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: at('res'), dpr: at('dpr'), size: at('size'), a: at('a'), t: at('t'), g: at('g') };
  const clear = () => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };
  return {
    clear,
    draw(u, width, height) {
      const w = Math.round(width * k);
      const h = Math.round(height * k);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      clear();
      gl.uniform2f(U.res, width, height);
      gl.uniform1f(U.dpr, k);
      gl.uniform2f(U.size, u.size[0]!, u.size[1]!);
      gl.uniform1f(U.a, u.a);
      gl.uniform1f(U.t, u.t);
      gl.uniform1f(U.g, u.g);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

export function Light({ width, height, uniforms }: LightProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const painter = useRef<Painter | null | undefined>(undefined);
  const [on, setOn] = useState(false);
  useAnimatedReaction(
    () => lit(uniforms.value),
    (now, before) => {
      if (now !== before) runOnJS(setOn)(now);
    },
  );
  useEffect(() => {
    if (!on || !canvas.current) return;
    if (painter.current === undefined) painter.current = painterFor(canvas.current);
    const p = painter.current;
    if (!p) return;
    let frame = 0;
    const draw = () => {
      p.draw(uniforms.value, width, height);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      p.clear();
    };
  }, [on, width, height, uniforms]);
  return (
    <View pointerEvents="none" style={[s.layer, { width, height, opacity: on ? 1 : 0 }]} testID="card-light">
      {React.createElement('canvas', { ref: canvas, style: { width, height, display: 'block' } })}
    </View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, zIndex: 6 },
});
