(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,587816,e=>{"use strict";var t=e.i(354012),r=e.i(475796),o=e.i(964355),a=e.i(725542),n=e.i(613352),i=e.i(120194),s=e.i(907953);function l(e,t){let r,o=()=>{let{currentTime:o}=t,a=(null===o?0:o.value)/100;r!==a&&e(a),r=a};return s.frame.preUpdate(o,!0),()=>(0,s.cancelFrame)(o)}function c(e){return!("u"<typeof window)&&(e?(0,r.supportsViewTimeline)():(0,r.supportsScrollTimeline)())}var u=e.i(862337),f=e.i(470934),d=e.i(398361);let h=()=>({current:0,offset:[],progress:0,scrollLength:0,targetOffset:0,targetLength:0,containerLength:0,velocity:0}),m={x:{length:"Width",position:"Left"},y:{length:"Height",position:"Top"}};function p(e,t,r,o){let a=r[t],{length:n,position:i}=m[t],s=a.current,l=r.time;a.current=Math.abs(e[`scroll${i}`]),a.scrollLength=e[`scroll${n}`]-e[`client${n}`],a.offset.length=0,a.offset[0]=0,a.offset[1]=a.scrollLength,a.progress=(0,f.progress)(0,a.scrollLength,a.current);let c=o-l;a.velocity=c>50?0:(0,d.velocityPerSecond)(a.current-s,c)}e.i(340063);var g=e.i(562667),v=e.i(931224),w=e.i(508983),x=e.i(261427);let y={start:0,center:.5,end:1};function b(e,t,r=0){let o=0;if(e in y&&(e=y[e]),"string"==typeof e){let t=parseFloat(e);e.endsWith("px")?o=t:e.endsWith("%")?e=t/100:e.endsWith("vw")?o=t/100*document.documentElement.clientWidth:e.endsWith("vh")?o=t/100*document.documentElement.clientHeight:e=t}return"number"==typeof e&&(o=t*e),r+o}let _=[0,0],k=[[0,0],[1,1]],M={x:0,y:0},T=new WeakMap,A=new WeakMap,R=new WeakMap,S=new WeakMap,L=new WeakMap,E=e=>e===document.scrollingElement?window:e;function N(e,{container:t=document.scrollingElement,trackContentSize:r=!1,...o}={}){if(!t)return i.noop;let a=R.get(t);a||(a=new Set,R.set(t,a));let n=function(e,t,r,o={}){return{measure:t=>{!function(e,t=e,r){if(r.x.targetOffset=0,r.y.targetOffset=0,t!==e){let o=t;for(;o&&o!==e;)r.x.targetOffset+=o.offsetLeft,r.y.targetOffset+=o.offsetTop,o=o.offsetParent}r.x.targetLength=t===e?t.scrollWidth:t.clientWidth,r.y.targetLength=t===e?t.scrollHeight:t.clientHeight,r.x.containerLength=e.clientWidth,r.y.containerLength=e.clientHeight}(e,o.target,r),p(e,"x",r,t),p(e,"y",r,t),r.time=t,(o.offset||o.target)&&function(e,t,r){let{offset:o=k}=r,{target:a=e,axis:n="y"}=r,i="y"===n?"height":"width",s=a!==e?function(e,t){let r={x:0,y:0},o=e;for(;o&&o!==t;)if((0,x.isHTMLElement)(o))r.x+=o.offsetLeft,r.y+=o.offsetTop,o=o.offsetParent;else if("svg"===o.tagName){let e=o.getBoundingClientRect(),t=(o=o.parentElement).getBoundingClientRect();r.x+=e.left-t.left,r.y+=e.top-t.top}else if(o instanceof SVGGraphicsElement){let{x:e,y:t}=o.getBBox();r.x+=e,r.y+=t;let a=null,n=o.parentNode;for(;!a;)"svg"===n.tagName&&(a=n),n=o.parentNode;o=a}else break;return r}(a,e):M,l=a===e?{width:e.scrollWidth,height:e.scrollHeight}:"getBBox"in a&&"svg"!==a.tagName?a.getBBox():{width:a.clientWidth,height:a.clientHeight},c={width:e.clientWidth,height:e.clientHeight};t[n].offset.length=0;let u=!t[n].interpolate,f=o.length;for(let e=0;e<f;e++){let r=function(e,t,r,o){let a=Array.isArray(e)?e:_,n=0;return"number"==typeof e?a=[e,e]:"string"==typeof e&&(a=(e=e.trim()).includes(" ")?e.split(" "):[e,y[e]?e:"0"]),(n=b(a[0],r,o))-b(a[1],t)}(o[e],c[i],l[i],s[n]);u||r===t[n].interpolatorOffsets[e]||(u=!0),t[n].offset[e]=r}u&&(t[n].interpolate=(0,g.interpolate)(t[n].offset,(0,v.defaultOffset)(o),{clamp:!1}),t[n].interpolatorOffsets=[...t[n].offset]),t[n].progress=(0,w.clamp)(0,1,t[n].interpolate(t[n].current))}(e,r,o)},notify:()=>t(r)}}(t,e,{time:0,x:h(),y:h()},o);if(a.add(n),!T.has(t)){let e=()=>{for(let e of a)e.measure(s.frameData.timestamp);s.frame.preUpdate(r)},r=()=>{for(let e of a)e.notify()},o=()=>s.frame.read(e);T.set(t,o);let n=E(t);window.addEventListener("resize",o),t!==document.documentElement&&A.set(t,(0,u.resize)(t,o)),n.addEventListener("scroll",o),o()}if(r&&!L.has(t)){let e=T.get(t),r={width:t.scrollWidth,height:t.scrollHeight};S.set(t,r);let o=s.frame.read(()=>{let o=t.scrollWidth,a=t.scrollHeight;(r.width!==o||r.height!==a)&&(e(),r.width=o,r.height=a)},!0);L.set(t,o)}let l=T.get(t);return s.frame.read(l,!1,!0),()=>{(0,s.cancelFrame)(l);let e=R.get(t);if(!e||(e.delete(n),e.size))return;let r=T.get(t);T.delete(t),r&&(E(t).removeEventListener("scroll",r),A.get(t)?.(),window.removeEventListener("resize",r));let o=L.get(t);o&&((0,s.cancelFrame)(o),L.delete(t)),S.delete(t)}}let P=[[[[0,1],[1,1]],"entry"],[[[0,0],[1,0]],"exit"],[[[1,0],[0,1]],"cover"],[k,"contain"]],C={start:0,end:1};function j(e){if(!e)return{rangeStart:"contain 0%",rangeEnd:"contain 100%"};for(let[t,r]of P)if(function(e,t){let r=function(e){if(2!==e.length)return;let t=[];for(let r of e)if(Array.isArray(r))t.push(r);else{if("string"!=typeof r)return;let e=function(e){let t=e.trim().split(/\s+/);if(2!==t.length)return;let r=C[t[0]],o=C[t[1]];if(void 0!==r&&void 0!==o)return[r,o]}(r);if(!e)return;t.push(e)}return t}(e);if(!r)return!1;for(let e=0;e<2;e++){let o=r[e],a=t[e];if(o[0]!==a[0]||o[1]!==a[1])return!1}return!0}(e,t))return{rangeStart:`${r} 0%`,rangeEnd:`${r} 100%`}}let H=new Map;function F(e){let t={value:0},r=N(r=>{t.value=100*r[e.axis].progress},e);return{currentTime:t,cancel:r}}function z({source:e,container:t,...r}){let{axis:o}=r;e&&(t=e);let a=H.get(t);a||(a=new Map,H.set(t,a));let n=r.target??"self",i=a.get(n);i||(i={},a.set(n,i));let s=o+(r.offset??[]).join(",");return i[s]||(r.target&&c(r.target)?j(r.offset)?i[s]=new ViewTimeline({subject:r.target,axis:o}):i[s]=F({container:t,...r}):c()?i[s]=new ScrollTimeline({source:t,axis:o}):i[s]=F({container:t,...r})),i[s]}function I(e,{axis:t="y",container:r=document.scrollingElement,...o}={}){let a,n,s;if(!r)return i.noop;let u={axis:t,container:r,...o};return"function"==typeof e?function(e,t){return 2===e.length||t&&(t.target||t.offset)?N(r=>{e(r[t.axis].progress,r)},t):l(e,z(t))}(e,u):(a=z(u),n=u.target?j(u.offset):void 0,s=u.target?c(u.target)&&!!n:c(),e.attachTimeline({timeline:s?a:void 0,...n&&s&&{rangeStart:n.rangeStart,rangeEnd:n.rangeEnd},observe:e=>(e.pause(),l(t=>{e.time=e.iterationDuration*t},a))}))}var W=e.i(900893),O=e.i(478146);let B=()=>({scrollX:(0,o.motionValue)(0),scrollY:(0,o.motionValue)(0),scrollXProgress:(0,o.motionValue)(0),scrollYProgress:(0,o.motionValue)(0)}),D=e=>!!e&&!e.current;function U(e,r,o,a){return{factory:n=>{let i,s=()=>{D(o)||D(a)?t.microtask.read(s):i=I(n,{...r,axis:e,container:o?.current||void 0,target:a?.current||void 0})};return t.microtask.read(s),()=>{(0,t.cancelMicrotask)(s),i?.()}},times:[0,1],keyframes:[0,1],ease:e=>e,duration:1}}e.s(["useScroll",0,function({container:e,target:o,...i}={}){var s;let l=(0,W.useConstant)(B);s=i.offset,!("u"<typeof window)&&(o?(0,r.supportsViewTimeline)()&&!!j(s):(0,r.supportsScrollTimeline)())&&(l.scrollXProgress.accelerate=U("x",i,e,o),l.scrollYProgress.accelerate=U("y",i,e,o));let c=(0,n.useRef)(null),u=(0,n.useRef)(!1),f=(0,n.useCallback)(()=>(c.current=I((e,{x:t,y:r})=>{l.scrollX.set(t.current),l.scrollXProgress.set(t.progress),l.scrollY.set(r.current),l.scrollYProgress.set(r.progress)},{...i,container:e?.current||void 0,target:o?.current||void 0}),()=>{c.current?.()}),[e,o,JSON.stringify(i.offset)]);return(0,O.useIsomorphicLayoutEffect)(()=>{if(u.current=!1,!(D(e)||D(o)))return f();u.current=!0},[f]),(0,n.useEffect)(()=>{let r;if(!u.current)return;let n=()=>{let t=D(e),n=D(o);(0,a.invariant)(!t,"Container ref is defined but not hydrated","use-scroll-ref"),(0,a.invariant)(!n,"Target ref is defined but not hydrated","use-scroll-ref"),t||n||(r=f())};return t.microtask.read(n),()=>{(0,t.cancelMicrotask)(n),r?.()}},[f]),l}],587816)},508324,803534,e=>{"use strict";var t=e.i(562667),r=e.i(900893),o=e.i(907953),a=e.i(478146),n=e.i(964355),i=e.i(613352),s=e.i(451347);function l(e){let t=(0,r.useConstant)(()=>(0,n.motionValue)(e)),{isStatic:o}=(0,i.useContext)(s.MotionConfigContext);if(o){let[,r]=(0,i.useState)(e);(0,i.useEffect)(()=>t.on("change",r),[])}return t}function c(e,t){let r=l(t()),n=()=>r.set(t());return n(),(0,a.useIsomorphicLayoutEffect)(()=>{let t=()=>o.frame.preRender(n,!1,!0),r=e.map(e=>e.on("change",t));return()=>{r.forEach(e=>e()),(0,o.cancelFrame)(n)}}),r}e.s(["useMotionValue",0,l],803534);function u(e,t){let o=(0,r.useConstant)(()=>[]);return c(e,()=>{o.length=0;let r=e.length;for(let t=0;t<r;t++)o[t]=e[t].get();return t(o)})}e.s(["useTransform",0,function e(o,a,i,s){if("function"==typeof o){let e;return n.collectMotionValues.current=[],o(),e=c(n.collectMotionValues.current,o),n.collectMotionValues.current=void 0,e}if(void 0!==i&&!Array.isArray(i)&&"function"!=typeof a){var l=o,f=a,d=i,h=s;let t=(0,r.useConstant)(()=>Object.keys(d)),n=(0,r.useConstant)(()=>({}));for(let r of t)n[r]=e(l,f,d[r],h);return n}let m="function"==typeof a?a:function(...e){let r=!Array.isArray(e[0]),o=r?0:-1,a=e[0+o],n=e[1+o],i=e[2+o],s=e[3+o],l=(0,t.interpolate)(n,i,s);return r?l(a):l}(a,i,s),p=Array.isArray(o)?u(o,m):u([o],([e])=>m(e)),g=Array.isArray(o)?void 0:o.accelerate;return g&&!g.isTransformed&&"function"!=typeof a&&Array.isArray(i)&&s?.clamp!==!1&&(p.accelerate={...g,times:a,keyframes:i,isTransformed:!0,...s?.ease?{ease:s.ease}:{}}),p}],508324)},885341,e=>{"use strict";var t=e.i(623157),r=e.i(613352);let o={patchSize:1,threadR:.009,cotton:1,threadColor:"#efe7d2",stitchMix:.3,machine:0,period:.13,stitchLen:.033,weave:.7,swayAmp:1,swaySpeed:.4,seed:null,fallbackProgress:1},a=`attribute vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`,n=`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
}`,i=new WeakMap;e.s(["MuraqqaaHeroBackdrop",0,function({className:e,progressRef:s,progress:l,config:c}){let u=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e,t=u.current;if(!t)return;let r=i.get(t);void 0!==r&&window.clearTimeout(r),i.delete(t);let f=t.getContext("webgl",{antialias:!1});if(!f)return;let d=window.matchMedia("(prefers-reduced-motion: reduce)").matches,h={...o,...c},m=h.seed??Math.floor(100*Math.random())+1,p=(e,t)=>{let r=f.createShader(e);return f.shaderSource(r,t),f.compileShader(r),r},g=f.createProgram(),v=p(f.VERTEX_SHADER,a),w=p(f.FRAGMENT_SHADER,n);f.attachShader(g,v),f.attachShader(g,w),f.linkProgram(g),f.deleteShader(v),f.deleteShader(w),f.useProgram(g);let x=f.createBuffer();f.bindBuffer(f.ARRAY_BUFFER,x),f.bufferData(f.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),f.STATIC_DRAW);let y=f.getAttribLocation(g,"a_position");f.enableVertexAttribArray(y),f.vertexAttribPointer(y,2,f.FLOAT,!1,0,0);let b={res:f.getUniformLocation(g,"u_res"),time:f.getUniformLocation(g,"u_time"),progress:f.getUniformLocation(g,"u_progress"),seed:f.getUniformLocation(g,"u_seed"),stitchMix:f.getUniformLocation(g,"u_stitchMix"),cotton:f.getUniformLocation(g,"u_cotton"),machine:f.getUniformLocation(g,"u_machine"),threadR:f.getUniformLocation(g,"u_threadR"),period:f.getUniformLocation(g,"u_period"),stitchLen:f.getUniformLocation(g,"u_stitchLen"),swayAmp:f.getUniformLocation(g,"u_swayAmp"),swaySpeed:f.getUniformLocation(g,"u_swaySpeed"),weave:f.getUniformLocation(g,"u_weave"),rows:f.getUniformLocation(g,"u_rows"),threadColor:f.getUniformLocation(g,"u_threadColor")},[_,k,M]=[parseInt((e=h.threadColor.replace("#","")).slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255];f.uniform1f(b.seed,m),f.uniform1f(b.stitchMix,h.stitchMix),f.uniform1f(b.cotton,h.cotton),f.uniform1f(b.machine,h.machine),f.uniform1f(b.threadR,h.threadR),f.uniform1f(b.period,h.period),f.uniform1f(b.stitchLen,h.stitchLen),f.uniform1f(b.swayAmp,h.swayAmp),f.uniform1f(b.swaySpeed,h.swaySpeed),f.uniform1f(b.weave,h.weave),f.uniform1f(b.rows,8/Math.max(.1,h.patchSize)),f.uniform3f(b.threadColor,_,k,M);let T=t.getBoundingClientRect(),A=0,R="visible"===document.visibilityState,S=!0,L=!1,E=performance.now(),N=!d&&0!==h.swayAmp&&0!==h.swaySpeed,P=()=>{let e=Math.min(window.devicePixelRatio||1,2),r=Math.max(1,Math.round(T.width*e)),o=Math.max(1,Math.round(T.height*e)),a=Math.min(1,Math.sqrt(2e6/Math.max(1,r*o))),n=Math.max(1,Math.round(r*a)),i=Math.max(1,Math.round(o*a));(t.width!==n||t.height!==i)&&(t.width=n,t.height=i,f.viewport(0,0,n,i))};function C(){!L&&R&&S&&0===A&&(A=requestAnimationFrame(W))}let j=()=>{T=t.getBoundingClientRect(),P(),C()};window.addEventListener("resize",j);let H=new ResizeObserver(j);H.observe(t);let F=new IntersectionObserver(([e])=>{(S=e?.isIntersecting??!0)?C():0!==A&&(cancelAnimationFrame(A),A=0)});F.observe(t);let z=()=>{(R="visible"===document.visibilityState)?C():0!==A&&(cancelAnimationFrame(A),A=0)};document.addEventListener("visibilitychange",z);let I=l?.on("change",C);function W(e){A=0,!L&&R&&S&&f&&(P(),f.uniform2f(b.res,t.width,t.height),f.uniform1f(b.time,d||!N?0:(e-E)/1e3),f.uniform1f(b.progress,d?1:l?.get()??s?.current??h.fallbackProgress),f.drawArrays(f.TRIANGLES,0,3),N&&C())}return C(),()=>{L=!0,cancelAnimationFrame(A),H.disconnect(),F.disconnect(),I?.(),document.removeEventListener("visibilitychange",z),window.removeEventListener("resize",j),f.deleteBuffer(x),f.deleteProgram(g);let e=window.setTimeout(()=>{i.get(t)===e&&(i.delete(t),f.getExtension("WEBGL_lose_context")?.loseContext(),t.width=1,t.height=1)},0);i.set(t,e)}},[]),(0,t.jsx)("canvas",{ref:u,"aria-hidden":!0,className:e,style:{display:"block",width:"100%",height:"100%"}})}])},243479,e=>{"use strict";var t=e.i(623157),r=e.i(707524),o=e.i(114168),a=e.i(587816),n=e.i(508324),i=e.i(613352);function s(e){let t=43758.5453*Math.sin(12.9898*e);return t-Math.floor(t)}e.s(["FloatingParticles",0,function({count:e=18,className:a}){let n=(0,o.useReducedMotion)()??!1,l=(0,i.useMemo)(()=>Array.from({length:e},(e,t)=>({left:`${(96*s(t+1)+2).toFixed(2)}%`,top:`${(90*s(t+101)+5).toFixed(2)}%`,size:+(1+2*s(t+201)).toFixed(2),duration:+(7+9*s(t+301)).toFixed(2),delay:+(-12*s(t+401)).toFixed(2),drift:+(8+18*s(t+501)).toFixed(2)})),[e]);return(0,t.jsx)("div",{className:a,style:{position:"absolute",inset:0,pointerEvents:"none"},"aria-hidden":!0,children:l.map((e,o)=>(0,t.jsx)(r.motion.span,{style:{position:"absolute",left:e.left,top:e.top,width:e.size,height:e.size,borderRadius:"50%",background:"var(--kk-halo-c)",opacity:n?.15:void 0},animate:n?void 0:{y:[0,-e.drift,0],opacity:[.08,.35,.08]},transition:n?void 0:{duration:e.duration,delay:e.delay,repeat:1/0,ease:"easeInOut"}},o))})},"Parallax",0,function({children:e,range:s=24,className:l}){let c=(0,o.useReducedMotion)()??!1,u=(0,i.useRef)(null),{scrollYProgress:f}=(0,a.useScroll)({target:u,offset:["start end","end start"]}),d=(0,n.useTransform)(f,[0,1],[s,-s]);return(0,t.jsx)(r.motion.div,{ref:u,className:l,style:{y:c?0:d},children:e})}])},184516,e=>{"use strict";var t=e.i(623157),r=e.i(613352),o=e.i(707524),a=e.i(114168),n=e.i(587816),i=e.i(508324),s=e.i(885341);e.s(["FooterCloth",0,function({height:e="clamp(240px, 38vh, 420px)"}){let l=(0,r.useRef)(null),c=(0,a.useReducedMotion)()??!1,{scrollYProgress:u}=(0,n.useScroll)({target:l,offset:["start end","end end"]}),f=(0,i.useTransform)(u,[0,1],["inset(100% 0 0 0)","inset(0% 0 0 0)"]);return(0,t.jsx)(o.motion.div,{ref:l,"aria-hidden":!0,style:{height:e,pointerEvents:"none",clipPath:c?"inset(0% 0 0 0)":f,maskImage:"linear-gradient(to bottom, transparent, black 55%)",WebkitMaskImage:"linear-gradient(to bottom, transparent, black 55%)"},children:(0,t.jsx)(s.MuraqqaaHeroBackdrop,{className:"h-full w-full",progress:u,config:{patchSize:2,seed:29,swayAmp:0,swaySpeed:0,fallbackProgress:1}})})}])},553582,e=>{"use strict";var t=e.i(623157),r=e.i(613352);let o=[{amount:60,unit:"second"},{amount:60,unit:"minute"},{amount:24,unit:"hour"},{amount:7,unit:"day"},{amount:4.34524,unit:"week"},{amount:12,unit:"month"},{amount:1/0,unit:"year"}];e.s(["RelativeTime",0,function({iso:e,locale:a="en"}){let n=new Intl.DateTimeFormat(a,{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(e)),[i,s]=(0,r.useState)(n);return(0,r.useEffect)(()=>{s(function(e,t){let r=new Intl.RelativeTimeFormat(t,{numeric:"auto"}),a=(new Date(e).getTime()-Date.now())/1e3;for(let e of o){if(Math.abs(a)<e.amount)return r.format(Math.round(a),e.unit);a/=e.amount}return""}(e,a))},[e,a]),(0,t.jsx)("time",{dateTime:e,title:n,children:i})}])},253434,e=>{"use strict";var t=e.i(623157),r=e.i(707524),o=e.i(114168),a=e.i(587816),n=e.i(508324),i=e.i(613352);function s({count:e,radius:o,rotation:a,counterRotation:n,opacity:i}){return(0,t.jsx)(r.motion.div,{className:"absolute inset-0",style:{rotate:a,opacity:i},children:Array.from({length:e},(a,i)=>{let s=i/e*Math.PI*2-Math.PI/2,l=(50+Math.cos(s)*o).toFixed(4),c=(50+Math.sin(s)*o).toFixed(4);return(0,t.jsx)("span",{className:"absolute -translate-x-1/2 -translate-y-1/2",style:{left:`${l}%`,top:`${c}%`},children:(0,t.jsx)(r.motion.span,{dir:"rtl",lang:"ar",className:"kk-arabic block text-[clamp(0.8rem,2vw,1.2rem)] text-fd-muted-foreground",style:{rotate:n},children:"الله"})},i)})})}e.s(["HadraGathering",0,function(){let e=(0,i.useRef)(null),l=(0,o.useReducedMotion)()??!1,{scrollYProgress:c}=(0,a.useScroll)({target:e,offset:["start end","end start"]}),u=(0,n.useTransform)(c,[0,.2,.82,1],[-18,0,54,58]),f=(0,n.useTransform)(c,[0,.2,.82,1],[16,0,-68,-72]),d=(0,n.useTransform)(u,e=>-e),h=(0,n.useTransform)(f,e=>-e),m=(0,n.useTransform)(c,[0,.22,.82,1],[.84,1,1,.98]),p=(0,n.useTransform)(c,[0,.2,.82,1],[.28,1,1,.82]);return(0,t.jsxs)("div",{ref:e,className:"relative mx-auto aspect-square w-full max-w-[38rem]","aria-hidden":!0,children:[(0,t.jsx)("span",{className:"absolute inset-[5%] rounded-full border border-fd-border"}),(0,t.jsx)("span",{className:"absolute inset-[25%] rounded-full border border-fd-border/70"}),(0,t.jsx)("span",{dir:"rtl",lang:"ar",className:"kk-arabic absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(8rem,25vw,15rem)] leading-none text-fd-muted/60",children:"ه"}),(0,t.jsxs)(r.motion.div,{className:"absolute inset-0 z-[1]",style:{scale:l?1:m},children:[(0,t.jsx)(s,{count:12,radius:44,rotation:l?0:u,counterRotation:l?0:d,opacity:l?1:p}),(0,t.jsx)(s,{count:8,radius:29,rotation:l?0:f,counterRotation:l?0:h,opacity:l?.86:p})]}),(0,t.jsx)("span",{className:"absolute left-1/2 top-[42%] z-[2] h-[16%] w-px -translate-x-1/2 bg-[color:var(--kk-gold)] opacity-70"}),(0,t.jsx)("span",{className:"absolute left-1/2 top-1/2 z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--kk-gold)] shadow-[0_0_20px_color-mix(in_srgb,var(--kk-gold)_45%,transparent)]"})]})}])},457855,e=>{"use strict";var t=e.i(623157),r=e.i(613352),o=e.i(587816),a=e.i(885341);e.s(["MuraqqaaScrollField",0,function(){let e=(0,r.useRef)(null),{scrollYProgress:n}=(0,o.useScroll)({target:e,offset:["start end","center center"]});return(0,t.jsx)("div",{ref:e,className:"relative min-h-[26rem] overflow-hidden bg-black","aria-hidden":!0,children:(0,t.jsx)(a.MuraqqaaHeroBackdrop,{className:"absolute inset-0 h-full w-full",progress:n,config:{seed:17,patchSize:1.35,swayAmp:0,swaySpeed:0,fallbackProgress:1}})})}])},760173,e=>{"use strict";var t=e.i(623157),r=e.i(707524),o=e.i(114168);e.s(["PrincipleReveal",0,function({children:e,className:a}){let n=(0,o.useReducedMotion)()??!1;return(0,t.jsx)(r.motion.div,{className:a,initial:!n&&{opacity:.72,y:14},whileInView:{opacity:1,y:0},viewport:{once:!0,margin:"-8% 0px -8% 0px"},transition:{duration:.55*!n,ease:[.25,.46,.45,.94]},children:e})}])},718191,e=>{"use strict";var t=e.i(623157),r=e.i(707524),o=e.i(114168),a=e.i(587816),n=e.i(508324),i=e.i(613352);let s=Array.from({length:33},(e,t)=>{let r=t/33*Math.PI*2-Math.PI/2;return{left:`${(50+44*Math.cos(r)).toFixed(4)}%`,top:`${(50+47*Math.sin(r)).toFixed(4)}%`}});e.s(["SubhaStrand",0,function(){let e=(0,i.useRef)(null),l=(0,o.useReducedMotion)()??!1,{scrollYProgress:c}=(0,a.useScroll)({target:e,offset:["start end","end start"]}),u=(0,n.useTransform)(c,[.08,.92],[0,1],{clamp:!0}),f=(0,n.useTransform)(u,[0,1],[-5.454545454545454,354.54545454545456]),d=(0,n.useTransform)(u,e=>{let t=33*e;return 1+.18*Math.max(0,1-5*Math.abs(t-Math.round(t)))}),h=(0,n.useTransform)(u,e=>{let t=33*e;return .48+.52*Math.max(0,1-5*Math.abs(t-Math.round(t)))}),m=(0,n.useTransform)(u,e=>{let t=33*e;return .28*Math.max(0,1-3.2*(t-Math.floor(t)))});return(0,t.jsxs)("div",{ref:e,className:"relative mx-auto aspect-[4/5] w-full max-w-[34rem]","aria-hidden":!0,children:[(0,t.jsx)("span",{className:"absolute inset-[4%_7%] rounded-[50%] border border-fd-border"}),(0,t.jsx)(r.motion.div,{className:"absolute inset-[4%_7%]",style:{rotate:l?0:f},children:s.map((e,r)=>(0,t.jsx)("span",{className:"absolute h-[clamp(0.72rem,1.4vw,1.05rem)] w-[clamp(0.72rem,1.4vw,1.05rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fd-border bg-fd-background shadow-[0_1px_0_rgba(255,255,255,0.22)_inset]",style:{left:e.left,top:e.top}},r))}),(0,t.jsx)("span",{className:"absolute bottom-[1.5%] left-1/2 h-12 w-px -translate-x-1/2 bg-[color:var(--kk-gold)] opacity-60"}),(0,t.jsx)(r.motion.span,{className:"absolute bottom-[0.8%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-[color:var(--kk-gold)] blur-xl",style:{opacity:l?.12:m}}),(0,t.jsx)(r.motion.span,{className:"absolute bottom-[3.2%] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[color:var(--kk-gold)] bg-[color:var(--kk-soft)] shadow-[0_0_24px_color-mix(in_srgb,var(--kk-gold)_35%,transparent)]",style:{scale:l?1:d,opacity:l?.8:h}})]})}])}]);