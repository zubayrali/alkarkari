'use client';

// MuraqqaaField — the hero's ground: a generative muraqqaʿa (the faqīr's
// patched cloak) woven live in WebGL. Every patch is its own scrap of dyed
// cloth, sewn together with real cotton thread that crosses the seams. The
// whole sheet hangs and breathes in one coherent billow, and its dyes wake as
// the hero's reveal progress (0 → 1) rises.
//
// Ported from the tuned hi-fi mockup (.scratch/muraqqaaification/
// muraqqaa-hero-hifi-v2.html). Lifecycle (DPR/2MP cap, ResizeObserver,
// IntersectionObserver + visibilitychange pause, WEBGL_lose_context cleanup,
// prefers-reduced-motion → static lit frame) is the NightVeil pattern — zero
// deps. The 12-colour palette mirrors karkari-theme.css / the toolcraft
// engine — keep in sync.
//
// ┌─ TWEAK THE LOOK HERE ──────────────────────────────────────────────────┐
// │ Every knob lives in MURAQQAA_CONFIG below. Edit the values in code; each │
// │ comment carries its useful range. No runtime UI — this is the config.   │
// └─────────────────────────────────────────────────────────────────────────┘

import type { MotionValue } from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

export interface MuraqqaaConfig {
  patchSize: number; // 0.5–2.5 · bigger ⇒ bigger patches (rows = 8 / patchSize)
  threadR: number; // 0.006–0.03 · thread thickness (cell units)
  cotton: number; // 0 shiny floss ‥ 1 matte spun cotton
  threadColor: string; // hex · drives thread body / shadow / sheen
  stitchMix: number; // 0 running ‥ 1 whip/herringbone
  machine: number; // 0 hand-sewn (jittered) ‥ 1 machine lockstitch (even, straight)
  period: number; // 0.09–0.4 · along-seam stitch spacing
  stitchLen: number; // 0.02–0.12 · running-stitch half length
  weave: number; // 0–1.5 · woven fibre pronouncedness
  swayAmp: number; // 0–2.5 · idle billow amount
  swaySpeed: number; // 0–2.5 · idle billow speed
  seed: number | null; // null ⇒ a new cloth every load; set a number to pin one
  fallbackProgress: number; // 0–1 · reveal state used when no progressRef is driven in
}

// ── The signed-off look. Change any value; it takes effect on reload. ────────
export const MURAQQAA_CONFIG: MuraqqaaConfig = {
  patchSize: 1,
  threadR: 0.009,
  cotton: 1,
  threadColor: '#efe7d2',
  stitchMix: 0.3,
  machine: 0,
  period: 0.13,
  stitchLen: 0.033,
  weave: 0.7,
  swayAmp: 1,
  swaySpeed: 0.4,
  seed: null,
  fallbackProgress: 1,
};

const VERT = `attribute vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_progress;
uniform float u_seed;
uniform float u_stitchMix;
uniform float u_cotton;
uniform float u_machine;
uniform float u_threadR;
uniform float u_period;
uniform float u_stitchLen;
uniform float u_swayAmp;
uniform float u_swaySpeed;
uniform float u_weave;
uniform float u_rows;
uniform vec3 u_threadColor;

float hash21(vec2 p){
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float grainHash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/* the muraqqaʿa spectrum — keep in sync with karkari-theme.css / the toolcraft engine */
vec3 pal(float i){
  if (i < 0.5)  return vec3(0.824, 0.231, 0.204); /* crimson   */
  if (i < 1.5)  return vec3(0.910, 0.463, 0.169); /* orange    */
  if (i < 2.5)  return vec3(0.949, 0.698, 0.180); /* saffron   */
  if (i < 3.5)  return vec3(0.624, 0.757, 0.227); /* lime      */
  if (i < 4.5)  return vec3(0.184, 0.620, 0.329); /* emerald   */
  if (i < 5.5)  return vec3(0.086, 0.639, 0.639); /* teal      */
  if (i < 6.5)  return vec3(0.184, 0.455, 0.788); /* cobalt    */
  if (i < 7.5)  return vec3(0.275, 0.325, 0.769); /* indigo    */
  if (i < 8.5)  return vec3(0.478, 0.251, 0.678); /* violet    */
  if (i < 9.5)  return vec3(0.761, 0.255, 0.541); /* magenta   */
  if (i < 10.5) return vec3(0.769, 0.227, 0.314); /* rose-red  */
  if (i < 11.5) return vec3(0.137, 0.486, 0.329); /* deep green*/
  if (i < 12.5) return vec3(0.961, 0.961, 0.961); /* undyed    */
  return vec3(0.078, 0.078, 0.078);               /* ink       */
}
float rawIdx(vec2 c){ return floor(hash21(c * 1.7 + 23.1 + u_seed) * 14.0); }
/* no two alike touching (one retry vs left+top, the garment's rule) */
float idxOf(vec2 c){
  float b = rawIdx(c);
  float L = rawIdx(c - vec2(1.0, 0.0));
  float T = rawIdx(c - vec2(0.0, 1.0));
  if (b == L || b == T) b = mod(b + 5.0, 14.0);
  return b;
}

const float WHIP_REACH = 0.110; /* how far a tick bites into EACH patch */
const float WHIP_SLANT = 0.100; /* tick slant along the seam */

/* unsigned distance to segment a->b (round caps come from thresholding) */
float sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

/* Add one seam family's thread. Swap x/y so a horizontal seam is evaluated as
   vertical, then swap the lighting normal back. Union by max coverage. */
void addThread(vec2 g, bool horiz, float seed, float sewProg,
               float aa, inout float cov, inout vec3 threadCol){
  vec3 THREAD_BODY   = u_threadColor;
  vec3 THREAD_SHADOW = u_threadColor * 0.45;
  vec3 THREAD_SPEC   = mix(u_threadColor, vec3(1.0), 0.55);
  vec2 q = horiz ? g.yx : g;
  float Nx = floor(q.x + 0.5);
  float whip = step(1.0 - u_stitchMix, hash21(vec2(Nx, horiz ? 7.3 : 3.1) + seed));
  whip *= 1.0 - u_machine;                              /* machine lockstitch always runs straight */
  float T = u_period * mix(1.0, 0.85, u_machine);
  float hand = 1.0 - u_machine;                          /* hand wobble & tilt fade as machine rises */
  float best = 9999.0;
  vec3 body = THREAD_BODY;
  float signedPerp = 0.0;
  vec2 axisQ = vec2(0.0, 1.0);
  float kbase = floor(q.y / T);
  for (int i = -1; i <= 1; i++){
    float k = kbase + float(i);
    float j1 = hash21(vec2(Nx, k) + seed);
    float j2 = hash21(vec2(Nx, k) + seed + 11.0);
    float j3 = hash21(vec2(Nx, k) + seed + 23.0);
    float appear = smoothstep(0.0, 0.06, sewProg - hash21(vec2(Nx, k) + seed + 31.0) * 0.12);
    if (appear < 0.001) continue;
    float yc = (k + 0.5) * T + (j1 - 0.5) * T * 0.18 * hand;
    vec2 a, b;
    if (whip < 0.5){                                    /* running: ON the seam */
      float hl = mix(u_stitchLen * (0.75 + 0.5 * j2), T * 0.42, u_machine);
      float tilt = (j3 - 0.5) * 0.05 * hand;
      a = vec2(Nx - tilt, yc - hl);
      b = vec2(Nx + tilt, yc + hl);
    } else {                                            /* whip: crosses INTO both patches */
      float w = WHIP_REACH * (0.8 + 0.4 * j2);
      float sl = WHIP_SLANT * (0.7 + 0.6 * j3);
      float dir = mod(k, 2.0) < 1.0 ? 1.0 : -1.0;
      a = vec2(Nx - w, yc - sl * dir);
      b = vec2(Nx + w, yc + sl * dir);
    }
    float d = sdSeg(q, a, b) + (1.0 - appear) * 0.05;
    if (d < best){
      best = d;
      axisQ = normalize(b - a);
      signedPerp = dot(q - a, vec2(axisQ.y, -axisQ.x));
      body = THREAD_BODY * (0.9 + 0.2 * j2 * hand);
    }
  }
  float c = 1.0 - smoothstep(u_threadR - aa, u_threadR + u_cotton * u_threadR * 0.5, best);
  if (c <= cov) return;
  float t = clamp(signedPerp / u_threadR, -1.0, 1.0);
  float nz = sqrt(max(0.0, 1.0 - t * t));
  vec2 perpQ = vec2(axisQ.y, -axisQ.x);
  vec2 perpG = horiz ? perpQ.yx : perpQ;
  vec3 nrm = normalize(vec3(t * perpG, nz));
  vec3 L = normalize(vec3(-0.55, 0.6, 0.55));
  float diff = clamp(dot(nrm, L), 0.0, 1.0);
  /* spun cotton: warm ecru, twisted-ply banding + loose-fibre grain */
  float along = q.y;
  vec3 cot = body * vec3(1.03, 1.0, 0.92);
  cot *= (0.9 + 0.1 * sin(along * 130.0 + Nx * 4.0))
       * (0.86 + 0.28 * hash21(vec2(floor(along * 55.0), Nx) + seed));
  vec3 fBody   = mix(body, cot, u_cotton);
  vec3 fShadow = mix(THREAD_SHADOW, cot * 0.7, u_cotton);
  float spec = pow(diff, mix(20.0, 4.0, u_cotton)) * mix(1.0, 0.20, u_cotton);
  cov = c;
  threadCol = mix(fShadow, fBody, diff) + spec * THREAD_SPEC;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float p = clamp(u_progress, 0.0, 1.0);

  /* the cloth hangs and breathes: ONE soft, coherent billow over the whole sheet */
  float ts = u_time * u_swaySpeed;
  vec2 sway = vec2(
    sin(uv.x * 1.3 + uv.y * 0.6 + ts * 0.50) + 0.35 * sin(uv.y * 2.1 - ts * 0.33),
    sin(uv.y * 1.1 - uv.x * 0.5 + ts * 0.43) + 0.35 * sin(uv.x * 1.9 + ts * 0.37)
  );
  sway *= (0.4 + 0.6 * (1.0 - uv.y)) * 0.006 * u_swayAmp; /* pinned near the top, freer at the hem */
  vec2 uvd = uv + sway;

  /* the quilt: full tiling, hand-cut seams (warp seeded) */
  float rows = u_rows;
  vec2 gcount = vec2(floor(rows * aspect + 0.5), rows);
  vec2 gp = uvd * gcount;
  gp += (vec2(vnoise(gp * 0.9 + 3.7 + u_seed), vnoise(gp * 0.9 + 17.3 + u_seed)) - 0.5) * 0.30;
  vec2 cell = floor(gp);
  vec2 f = fract(gp);

  vec3 cloth = pal(idxOf(cell));
  cloth *= 0.93 + 0.14 * hash21(cell + 5.5 + u_seed);  /* dye-lot breath */

  /* woven scraps: every patch a different cloth — its own weave angle/scale/fibre */
  vec2 wv = uvd * vec2(aspect, 1.0);
  float ang = (hash21(cell + 2.2 + u_seed) - 0.5) * 1.2;
  float ca = cos(ang), sa = sin(ang);
  vec2 rv = (mat2(ca, -sa, sa, ca) * wv) * (0.85 + 0.4 * hash21(cell + 4.1 + u_seed));
  float weft = vnoise(rv * vec2(22.0, 300.0));
  float warpN = vnoise(rv * vec2(300.0, 22.0));
  cloth *= 1.0 + (weft + warpN - 1.0) * 0.06 * u_weave;  /* the interlace */
  cloth *= 0.97 + 0.06 * vnoise(wv * 210.0) * u_weave;   /* fine cotton nap */

  /* each patch a soft pillow: lifted in the middle, dipping into the seams */
  vec2 fc = f - 0.5;
  cloth *= 0.90 + 0.10 * (1.0 - dot(fc, fc) * 1.5);

  cloth *= 0.985 + 0.03 * sin(u_time * 0.5 + hash21(cell + 9.3 + u_seed) * 6.28318);

  /* dyes wake from the night patch by patch, then hold at full colour */
  float th = hash21(cell + 7.3 + u_seed);
  float wake = mix(0.04, 1.0, smoothstep(0.0, 0.35, p * 1.35 - th * 0.7));
  vec3 col = cloth * wake;

  /* REAL THREAD: lit round cotton on the seams, biting into both patches */
  float aa = 1.3 * rows / u_res.y;
  float sewProg = smoothstep(0.10, 0.92, p) * 0.14;
  float cov = 0.0; vec3 threadCol = vec3(0.0);
  addThread(gp, false, u_seed, sewProg, aa, cov, threadCol);
  addThread(gp, true,  u_seed, sewProg, aa, cov, threadCol);
  float sc = 0.0; vec3 ig = vec3(0.0);
  vec2 sStep = normalize(vec2(-0.6, 0.6)) * (u_threadR * 1.1);
  addThread(gp + sStep, false, u_seed, sewProg, aa, sc, ig);
  addThread(gp + sStep, true,  u_seed, sewProg, aa, sc, ig);
  float drop = clamp(sc - cov, 0.0, 1.0);

  float ex = min(f.x, 1.0 - f.x), ey = min(f.y, 1.0 - f.y);
  float seam = smoothstep(0.020, 0.006, min(ex, ey));
  col = mix(col, col * 0.55, seam * 0.6);
  col *= 1.0 - drop * 0.30;                             /* cast shadow under the thread */
  col = mix(col, threadCol, cov);                      /* the raised floss on top */
  col += (grainHash(gl_FragCoord.xy) - 0.5) * 0.02 * cov;

  /* warm central ground for the wordmark — NO white orb */
  vec2 cdir = (uv - vec2(0.5, 0.63)) * vec2(aspect, 1.0);
  float warm = exp(-dot(cdir, cdir) * 22.0) * smoothstep(0.35, 0.85, p) * 0.10;
  col *= 1.0 + warm;
  col += vec3(1.0, 0.94, 0.82) * warm * 0.35;

  /* framing vignette (edges keep the night); deeper while still dark */
  float veil = (1.0 - smoothstep(0.0, 0.6, p)) * 0.22;
  col *= 1.0 - veil;
  float vd = length(uv - 0.5) * 1.41421356;
  col *= 1.0 - (0.30 + veil) * smoothstep(0.42, 1.05, vd);

  col += (grainHash(gl_FragCoord.xy) - 0.5) * 0.02;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

const pendingContextReleases = new WeakMap<HTMLCanvasElement, number>();

interface MuraqqaaFieldProps {
  className?: string;
  /** Live reveal progress 0..1 (0 = muraqqaʿa in the dark, 1 = full light). The
   *  hero writes to `.current` each scroll/animation frame; the shader reads it. */
  progressRef?: RefObject<number>;
  /** Observable progress for event-driven instances that should stop rendering
   *  when scrolling stops. Prefer this when ambient sway is disabled. */
  progress?: MotionValue<number>;
  /** Per-instance overrides on top of MURAQQAA_CONFIG (e.g. the footer band
   *  uses bigger patches). Read once on mount, like the config itself. */
  config?: Partial<MuraqqaaConfig>;
}

export function MuraqqaaHeroBackdrop({ className, progressRef, progress, config }: MuraqqaaFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pendingRelease = pendingContextReleases.get(canvas);
    if (pendingRelease !== undefined) window.clearTimeout(pendingRelease);
    pendingContextReleases.delete(canvas);
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return; // the .kk-night-panel radial ground remains underneath

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cfg = { ...MURAQQAA_CONFIG, ...config };
    const seed = cfg.seed ?? Math.floor(Math.random() * 100) + 1;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(program, 'u_res'),
      time: gl.getUniformLocation(program, 'u_time'),
      progress: gl.getUniformLocation(program, 'u_progress'),
      seed: gl.getUniformLocation(program, 'u_seed'),
      stitchMix: gl.getUniformLocation(program, 'u_stitchMix'),
      cotton: gl.getUniformLocation(program, 'u_cotton'),
      machine: gl.getUniformLocation(program, 'u_machine'),
      threadR: gl.getUniformLocation(program, 'u_threadR'),
      period: gl.getUniformLocation(program, 'u_period'),
      stitchLen: gl.getUniformLocation(program, 'u_stitchLen'),
      swayAmp: gl.getUniformLocation(program, 'u_swayAmp'),
      swaySpeed: gl.getUniformLocation(program, 'u_swaySpeed'),
      weave: gl.getUniformLocation(program, 'u_weave'),
      rows: gl.getUniformLocation(program, 'u_rows'),
      threadColor: gl.getUniformLocation(program, 'u_threadColor'),
    };

    // Look uniforms are static (the in-code config) — set once. Only res / time /
    // progress change per frame.
    const [tr, tg, tb] = hexToRgb(cfg.threadColor);
    gl.uniform1f(u.seed, seed);
    gl.uniform1f(u.stitchMix, cfg.stitchMix);
    gl.uniform1f(u.cotton, cfg.cotton);
    gl.uniform1f(u.machine, cfg.machine);
    gl.uniform1f(u.threadR, cfg.threadR);
    gl.uniform1f(u.period, cfg.period);
    gl.uniform1f(u.stitchLen, cfg.stitchLen);
    gl.uniform1f(u.swayAmp, cfg.swayAmp);
    gl.uniform1f(u.swaySpeed, cfg.swaySpeed);
    gl.uniform1f(u.weave, cfg.weave);
    gl.uniform1f(u.rows, 8 / Math.max(0.1, cfg.patchSize));
    gl.uniform3f(u.threadColor, tr, tg, tb);

    let bounds = canvas.getBoundingClientRect();
    let raf = 0;
    let visible = document.visibilityState === 'visible';
    let inView = true;
    let disposed = false;
    const start = performance.now();
    // Ambient cloths keep an rAF loop. Scroll-only cloths disable sway and
    // render only when their observable progress changes.
    const animate = !reduced && cfg.swayAmp !== 0 && cfg.swaySpeed !== 0;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rawW = Math.max(1, Math.round(bounds.width * dpr));
      const rawH = Math.max(1, Math.round(bounds.height * dpr));
      const scale = Math.min(1, Math.sqrt(2_000_000 / Math.max(1, rawW * rawH)));
      const width = Math.max(1, Math.round(rawW * scale));
      const height = Math.max(1, Math.round(rawH * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    function requestRender() {
      if (!disposed && visible && inView && raf === 0) raf = requestAnimationFrame(render);
    }

    const updateLayout = () => {
      bounds = canvas.getBoundingClientRect();
      resizeCanvas();
      requestRender();
    };
    window.addEventListener('resize', updateLayout);

    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) requestRender();
      else if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    intersectionObserver.observe(canvas);
    const onVisibilityChange = () => {
      visible = document.visibilityState === 'visible';
      if (visible) requestRender();
      else if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const unsubscribeProgress = progress?.on('change', requestRender);

    function render(now: number) {
      raf = 0;
      if (disposed || !visible || !inView || !gl) return;
      resizeCanvas();
      gl.uniform2f(u.res, canvas!.width, canvas!.height);
      gl.uniform1f(u.time, reduced || !animate ? 0 : (now - start) / 1000);
      gl.uniform1f(u.progress, reduced ? 1 : (progress?.get() ?? progressRef?.current ?? cfg.fallbackProgress));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (animate) requestRender();
    }
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      unsubscribeProgress?.();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', updateLayout);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      const releaseTimer = window.setTimeout(() => {
        if (pendingContextReleases.get(canvas) !== releaseTimer) return;
        pendingContextReleases.delete(canvas);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.width = 1;
        canvas.height = 1;
      }, 0);
      pendingContextReleases.set(canvas, releaseTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
