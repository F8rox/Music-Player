import { useEffect, useRef } from "react";
import { engine } from "../audio/engine";
import { useMusic } from "../state/useMusic";

// Full-screen WebGL background: an iridescent glow over a curved horizon with flowing light
// ribbons, in the theme's colours (read from CSS tokens), swelling with the live audio level.
const VERTEX = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLevel;
uniform vec3 uBg, uBlue, uViolet, uPink, uCyan;

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.07;
  float horizon = 0.12 + 0.10 * sin(p.x * 1.2 + t * 2.0) + 0.04 * sin(p.x * 3.3 - t * 3.0);
  float d = p.y - horizon;
  vec3 col = uBg;

  // Iridescent light sitting on the horizon, drifting through blue, violet and pink.
  float glow = exp(-abs(d) * 3.5) * smoothstep(0.8, -0.05, d);
  vec3 iri = mix(uBlue, uViolet, 0.5 + 0.5 * sin(p.x * 1.8 + t * 3.0));
  iri = mix(iri, uPink, 0.35 + 0.35 * sin(p.x * 3.1 - t * 2.4 + d * 5.0));
  col += iri * glow * (1.1 + 0.8 * uLevel);

  // Thin flowing ribbons of light above the horizon.
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = horizon + 0.05 + 0.035 * fi + 0.07 * sin(p.x * (1.4 + fi * 0.25) + t * (2.5 + fi * 0.6) + fi * 1.7);
    float line = 0.0018 / max(abs(p.y - y), 0.0008);
    col += mix(uBlue, uViolet, fi / 5.0) * line * (0.45 + 0.5 * uLevel);
  }

  // A crisp cyan rim along the horizon, then darkness below it.
  col += uCyan * exp(-abs(d) * 140.0) * 0.9 * smoothstep(-0.6, 0.6, p.x);
  col *= mix(0.18, 1.0, smoothstep(-0.015, 0.015, d));
  gl_FragColor = vec4(col, 1.0);
}`;

const SCALE = 0.6; // render below native resolution: it's soft light, so this saves GPU for free

const tokenRgb = (name) => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().slice(1, 7);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export const WaveBackground = () => {
  const { isPlaying } = useMusic();
  const canvasRef = useRef(null);
  const playing = useRef(isPlaying);

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return; // no WebGL: the CSS gradient on <body> stays as the background
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (name) => gl.getUniformLocation(program, name);
    for (const [uniform, token] of [["uBg", "--bg"], ["uBlue", "--accent-strong"], ["uViolet", "--violet"],
      ["uPink", "--energy-5"], ["uCyan", "--energy-1"]]) gl.uniform3fv(u(uniform), tokenRgb(token));

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let bins = null;
    let level = 0;
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      canvas.width = Math.round(innerWidth * SCALE);
      canvas.height = Math.round(innerHeight * SCALE);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u("uRes"), canvas.width, canvas.height);
    };
    const draw = () => {
      let target = 0;
      // Only read the analyser while playing: it must not create the AudioContext early.
      if (playing.current) {
        const analyser = engine.analyser();
        bins ??= new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        target = bins.subarray(0, 64).reduce((a, b) => a + b, 0) / (64 * 255);
      }
      level += (target - level) * 0.08; // ease, so the light breathes rather than flickers
      gl.uniform1f(u("uTime"), reduced ? 20 : (performance.now() - start) / 1000);
      gl.uniform1f(u("uLevel"), level);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      draw();
      if (!reduced && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) loop();
    };

    resize();
    loop();
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="wave-background" aria-hidden="true" />;
};
