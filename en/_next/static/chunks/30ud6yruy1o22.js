(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,671765,e=>{"use strict";e.s(["patchOf",0,function(e){let t=5381;for(let r=0;r<e.length;r++)t=(t<<5)+t+e.charCodeAt(r)|0;return(t>>>0)%12+1}])},79092,e=>{"use strict";e.i(340063);var t=e.i(623157),r=e.i(613352),o=e.i(3379),n=e.i(900893),i=e.i(478146),a=e.i(343777),s=e.i(261427),l=r,c=e.i(451347);function f(e,t){if("function"==typeof e)return e(t);null!=e&&(e.current=t)}class u extends l.Component{getSnapshotBeforeUpdate(e){let t=this.props.childRef.current;if((0,s.isHTMLElement)(t)&&e.isPresent&&!this.props.isPresent&&!1!==this.props.pop){let e=t.offsetParent,r=(0,s.isHTMLElement)(e)&&e.offsetWidth||0,o=(0,s.isHTMLElement)(e)&&e.offsetHeight||0,n=getComputedStyle(t),i=this.props.sizeRef.current;i.height=parseFloat(n.height),i.width=parseFloat(n.width),i.top=t.offsetTop,i.left=t.offsetLeft,i.right=r-i.width-i.left,i.bottom=o-i.height-i.top,i.direction=n.direction}return null}componentDidUpdate(){}render(){return this.props.children}}function d({children:e,isPresent:o,anchorX:n,anchorY:i,root:a,pop:s}){let h=(0,l.useId)(),m=(0,l.useRef)(null),p=(0,l.useRef)({width:0,height:0,top:0,left:0,right:0,bottom:0,direction:"ltr"}),{nonce:g}=(0,l.useContext)(c.MotionConfigContext),v=function(...e){return r.useCallback(function(...e){return t=>{let r=!1,o=e.map(e=>{let o=f(e,t);return r||"function"!=typeof o||(r=!0),o});if(r)return()=>{for(let t=0;t<o.length;t++){let r=o[t];"function"==typeof r?r():f(e[t],null)}}}}(...e),e)}(m,e.props?.ref??e?.ref);return(0,l.useInsertionEffect)(()=>{let{width:e,height:t,top:r,left:l,right:c,bottom:f,direction:u}=p.current;if(o||!1===s||!m.current||!e||!t)return;let d="rtl"===u,v="left"===n?d?`right: ${c}`:`left: ${l}`:d?`left: ${l}`:`right: ${c}`,w="bottom"===i?`bottom: ${f}`:`top: ${r}`;m.current.dataset.motionPopId=h;let y=document.createElement("style");g&&(y.nonce=g);let x=a??document.head;return x.appendChild(y),y.sheet&&y.sheet.insertRule(`
          [data-motion-pop-id="${h}"] {
            position: absolute !important;
            width: ${e}px !important;
            height: ${t}px !important;
            ${v}px !important;
            ${w}px !important;
          }
        `),()=>{m.current?.removeAttribute("data-motion-pop-id"),x.contains(y)&&x.removeChild(y)}},[o]),(0,t.jsx)(u,{isPresent:o,childRef:m,sizeRef:p,pop:s,children:!1===s?e:l.cloneElement(e,{ref:v})})}let h=({children:e,initial:o,isPresent:i,onExitComplete:s,custom:l,presenceAffectsLayout:c,mode:f,anchorX:u,anchorY:h,root:p})=>{let g=(0,n.useConstant)(m),v=(0,r.useId)(),w=!0,y=(0,r.useMemo)(()=>(w=!1,{id:v,initial:o,isPresent:i,custom:l,onExitComplete:e=>{for(let t of(g.set(e,!0),g.values()))if(!t)return;s&&s()},register:e=>(g.set(e,!1),()=>g.delete(e))}),[i,g,s]);return c&&w&&(y={...y}),(0,r.useMemo)(()=>{g.forEach((e,t)=>g.set(t,!1))},[i]),r.useEffect(()=>{i||g.size||!s||s()},[i]),e=(0,t.jsx)(d,{pop:"popLayout"===f,isPresent:i,anchorX:u,anchorY:h,root:p,children:e}),(0,t.jsx)(a.PresenceContext.Provider,{value:y,children:e})};function m(){return new Map}var p=e.i(126309);let g=e=>e.key||"";function v(e){let t=[];return r.Children.forEach(e,e=>{(0,r.isValidElement)(e)&&t.push(e)}),t}e.s(["AnimatePresence",0,({children:e,custom:a,initial:s=!0,onExitComplete:l,presenceAffectsLayout:c=!0,mode:f="sync",propagate:u=!1,anchorX:d="left",anchorY:m="top",root:w})=>{let[y,x]=(0,p.usePresence)(u),_=(0,r.useMemo)(()=>v(e),[e]),b=u&&!y?[]:_.map(g),E=(0,r.useRef)(!0),A=(0,r.useRef)(_),L=(0,n.useConstant)(()=>new Map),R=(0,r.useRef)(new Set),[C,T]=(0,r.useState)(_),[M,S]=(0,r.useState)(_);(0,i.useIsomorphicLayoutEffect)(()=>{E.current=!1,A.current=_;for(let e=0;e<M.length;e++){let t=g(M[e]);b.includes(t)?(L.delete(t),R.current.delete(t)):!0!==L.get(t)&&L.set(t,!1)}},[M,b.length,b.join("-")]);let k=[];if(_!==C){let e=[..._];for(let t=0;t<M.length;t++){let r=M[t],o=g(r);b.includes(o)||(e.splice(t,0,r),k.push(r))}return"wait"===f&&k.length&&(e=k),S(v(e)),T(_),null}let{forceRender:P}=(0,r.useContext)(o.LayoutGroupContext);return(0,t.jsx)(t.Fragment,{children:M.map(e=>{let r=g(e),o=(!u||!!y)&&(_===M||b.includes(r));return(0,t.jsx)(h,{isPresent:o,initial:(!E.current||!!s)&&void 0,custom:a,presenceAffectsLayout:c,mode:f,root:w,onExitComplete:o?void 0:()=>{if(R.current.has(r)||!L.has(r))return;R.current.add(r),L.set(r,!0);let e=!0;L.forEach(t=>{t||(e=!1)}),e&&(P?.(),S(A.current),u&&x?.(),l&&l())},anchorX:d,anchorY:m,children:e},r)})})}],79092)},587816,e=>{"use strict";var t=e.i(354012),r=e.i(475796),o=e.i(964355),n=e.i(725542),i=e.i(613352),a=e.i(120194),s=e.i(907953);function l(e,t){let r,o=()=>{let{currentTime:o}=t,n=(null===o?0:o.value)/100;r!==n&&e(n),r=n};return s.frame.preUpdate(o,!0),()=>(0,s.cancelFrame)(o)}function c(e){return!("u"<typeof window)&&(e?(0,r.supportsViewTimeline)():(0,r.supportsScrollTimeline)())}var f=e.i(862337),u=e.i(470934),d=e.i(398361);let h=()=>({current:0,offset:[],progress:0,scrollLength:0,targetOffset:0,targetLength:0,containerLength:0,velocity:0}),m={x:{length:"Width",position:"Left"},y:{length:"Height",position:"Top"}};function p(e,t,r,o){let n=r[t],{length:i,position:a}=m[t],s=n.current,l=r.time;n.current=Math.abs(e[`scroll${a}`]),n.scrollLength=e[`scroll${i}`]-e[`client${i}`],n.offset.length=0,n.offset[0]=0,n.offset[1]=n.scrollLength,n.progress=(0,u.progress)(0,n.scrollLength,n.current);let c=o-l;n.velocity=c>50?0:(0,d.velocityPerSecond)(n.current-s,c)}e.i(340063);var g=e.i(562667),v=e.i(931224),w=e.i(508983),y=e.i(261427);let x={start:0,center:.5,end:1};function _(e,t,r=0){let o=0;if(e in x&&(e=x[e]),"string"==typeof e){let t=parseFloat(e);e.endsWith("px")?o=t:e.endsWith("%")?e=t/100:e.endsWith("vw")?o=t/100*document.documentElement.clientWidth:e.endsWith("vh")?o=t/100*document.documentElement.clientHeight:e=t}return"number"==typeof e&&(o=t*e),r+o}let b=[0,0],E=[[0,0],[1,1]],A={x:0,y:0},L=new WeakMap,R=new WeakMap,C=new WeakMap,T=new WeakMap,M=new WeakMap,S=e=>e===document.scrollingElement?window:e;function k(e,{container:t=document.scrollingElement,trackContentSize:r=!1,...o}={}){if(!t)return a.noop;let n=C.get(t);n||(n=new Set,C.set(t,n));let i=function(e,t,r,o={}){return{measure:t=>{!function(e,t=e,r){if(r.x.targetOffset=0,r.y.targetOffset=0,t!==e){let o=t;for(;o&&o!==e;)r.x.targetOffset+=o.offsetLeft,r.y.targetOffset+=o.offsetTop,o=o.offsetParent}r.x.targetLength=t===e?t.scrollWidth:t.clientWidth,r.y.targetLength=t===e?t.scrollHeight:t.clientHeight,r.x.containerLength=e.clientWidth,r.y.containerLength=e.clientHeight}(e,o.target,r),p(e,"x",r,t),p(e,"y",r,t),r.time=t,(o.offset||o.target)&&function(e,t,r){let{offset:o=E}=r,{target:n=e,axis:i="y"}=r,a="y"===i?"height":"width",s=n!==e?function(e,t){let r={x:0,y:0},o=e;for(;o&&o!==t;)if((0,y.isHTMLElement)(o))r.x+=o.offsetLeft,r.y+=o.offsetTop,o=o.offsetParent;else if("svg"===o.tagName){let e=o.getBoundingClientRect(),t=(o=o.parentElement).getBoundingClientRect();r.x+=e.left-t.left,r.y+=e.top-t.top}else if(o instanceof SVGGraphicsElement){let{x:e,y:t}=o.getBBox();r.x+=e,r.y+=t;let n=null,i=o.parentNode;for(;!n;)"svg"===i.tagName&&(n=i),i=o.parentNode;o=n}else break;return r}(n,e):A,l=n===e?{width:e.scrollWidth,height:e.scrollHeight}:"getBBox"in n&&"svg"!==n.tagName?n.getBBox():{width:n.clientWidth,height:n.clientHeight},c={width:e.clientWidth,height:e.clientHeight};t[i].offset.length=0;let f=!t[i].interpolate,u=o.length;for(let e=0;e<u;e++){let r=function(e,t,r,o){let n=Array.isArray(e)?e:b,i=0;return"number"==typeof e?n=[e,e]:"string"==typeof e&&(n=(e=e.trim()).includes(" ")?e.split(" "):[e,x[e]?e:"0"]),(i=_(n[0],r,o))-_(n[1],t)}(o[e],c[a],l[a],s[i]);f||r===t[i].interpolatorOffsets[e]||(f=!0),t[i].offset[e]=r}f&&(t[i].interpolate=(0,g.interpolate)(t[i].offset,(0,v.defaultOffset)(o),{clamp:!1}),t[i].interpolatorOffsets=[...t[i].offset]),t[i].progress=(0,w.clamp)(0,1,t[i].interpolate(t[i].current))}(e,r,o)},notify:()=>t(r)}}(t,e,{time:0,x:h(),y:h()},o);if(n.add(i),!L.has(t)){let e=()=>{for(let e of n)e.measure(s.frameData.timestamp);s.frame.preUpdate(r)},r=()=>{for(let e of n)e.notify()},o=()=>s.frame.read(e);L.set(t,o);let i=S(t);window.addEventListener("resize",o),t!==document.documentElement&&R.set(t,(0,f.resize)(t,o)),i.addEventListener("scroll",o),o()}if(r&&!M.has(t)){let e=L.get(t),r={width:t.scrollWidth,height:t.scrollHeight};T.set(t,r);let o=s.frame.read(()=>{let o=t.scrollWidth,n=t.scrollHeight;(r.width!==o||r.height!==n)&&(e(),r.width=o,r.height=n)},!0);M.set(t,o)}let l=L.get(t);return s.frame.read(l,!1,!0),()=>{(0,s.cancelFrame)(l);let e=C.get(t);if(!e||(e.delete(i),e.size))return;let r=L.get(t);L.delete(t),r&&(S(t).removeEventListener("scroll",r),R.get(t)?.(),window.removeEventListener("resize",r));let o=M.get(t);o&&((0,s.cancelFrame)(o),M.delete(t)),T.delete(t)}}let P=[[[[0,1],[1,1]],"entry"],[[[0,0],[1,0]],"exit"],[[[1,0],[0,1]],"cover"],[E,"contain"]],H={start:0,end:1};function F(e){if(!e)return{rangeStart:"contain 0%",rangeEnd:"contain 100%"};for(let[t,r]of P)if(function(e,t){let r=function(e){if(2!==e.length)return;let t=[];for(let r of e)if(Array.isArray(r))t.push(r);else{if("string"!=typeof r)return;let e=function(e){let t=e.trim().split(/\s+/);if(2!==t.length)return;let r=H[t[0]],o=H[t[1]];if(void 0!==r&&void 0!==o)return[r,o]}(r);if(!e)return;t.push(e)}return t}(e);if(!r)return!1;for(let e=0;e<2;e++){let o=r[e],n=t[e];if(o[0]!==n[0]||o[1]!==n[1])return!1}return!0}(e,t))return{rangeStart:`${r} 0%`,rangeEnd:`${r} 100%`}}let N=new Map;function I(e){let t={value:0},r=k(r=>{t.value=100*r[e.axis].progress},e);return{currentTime:t,cancel:r}}function W({source:e,container:t,...r}){let{axis:o}=r;e&&(t=e);let n=N.get(t);n||(n=new Map,N.set(t,n));let i=r.target??"self",a=n.get(i);a||(a={},n.set(i,a));let s=o+(r.offset??[]).join(",");return a[s]||(r.target&&c(r.target)?F(r.offset)?a[s]=new ViewTimeline({subject:r.target,axis:o}):a[s]=I({container:t,...r}):c()?a[s]=new ScrollTimeline({source:t,axis:o}):a[s]=I({container:t,...r})),a[s]}function z(e,{axis:t="y",container:r=document.scrollingElement,...o}={}){let n,i,s;if(!r)return a.noop;let f={axis:t,container:r,...o};return"function"==typeof e?function(e,t){return 2===e.length||t&&(t.target||t.offset)?k(r=>{e(r[t.axis].progress,r)},t):l(e,W(t))}(e,f):(n=W(f),i=f.target?F(f.offset):void 0,s=f.target?c(f.target)&&!!i:c(),e.attachTimeline({timeline:s?n:void 0,...i&&s&&{rangeStart:i.rangeStart,rangeEnd:i.rangeEnd},observe:e=>(e.pause(),l(t=>{e.time=e.iterationDuration*t},n))}))}var O=e.i(900893),j=e.i(478146);let B=()=>({scrollX:(0,o.motionValue)(0),scrollY:(0,o.motionValue)(0),scrollXProgress:(0,o.motionValue)(0),scrollYProgress:(0,o.motionValue)(0)}),U=e=>!!e&&!e.current;function D(e,r,o,n){return{factory:i=>{let a,s=()=>{U(o)||U(n)?t.microtask.read(s):a=z(i,{...r,axis:e,container:o?.current||void 0,target:n?.current||void 0})};return t.microtask.read(s),()=>{(0,t.cancelMicrotask)(s),a?.()}},times:[0,1],keyframes:[0,1],ease:e=>e,duration:1}}e.s(["useScroll",0,function({container:e,target:o,...a}={}){var s;let l=(0,O.useConstant)(B);s=a.offset,!("u"<typeof window)&&(o?(0,r.supportsViewTimeline)()&&!!F(s):(0,r.supportsScrollTimeline)())&&(l.scrollXProgress.accelerate=D("x",a,e,o),l.scrollYProgress.accelerate=D("y",a,e,o));let c=(0,i.useRef)(null),f=(0,i.useRef)(!1),u=(0,i.useCallback)(()=>(c.current=z((e,{x:t,y:r})=>{l.scrollX.set(t.current),l.scrollXProgress.set(t.progress),l.scrollY.set(r.current),l.scrollYProgress.set(r.progress)},{...a,container:e?.current||void 0,target:o?.current||void 0}),()=>{c.current?.()}),[e,o,JSON.stringify(a.offset)]);return(0,j.useIsomorphicLayoutEffect)(()=>{if(f.current=!1,!(U(e)||U(o)))return u();f.current=!0},[u]),(0,i.useEffect)(()=>{let r;if(!f.current)return;let i=()=>{let t=U(e),i=U(o);(0,n.invariant)(!t,"Container ref is defined but not hydrated","use-scroll-ref"),(0,n.invariant)(!i,"Target ref is defined but not hydrated","use-scroll-ref"),t||i||(r=u())};return t.microtask.read(i),()=>{(0,t.cancelMicrotask)(i),r?.()}},[u]),l}],587816)},508324,803534,e=>{"use strict";var t=e.i(562667),r=e.i(900893),o=e.i(907953),n=e.i(478146),i=e.i(964355),a=e.i(613352),s=e.i(451347);function l(e){let t=(0,r.useConstant)(()=>(0,i.motionValue)(e)),{isStatic:o}=(0,a.useContext)(s.MotionConfigContext);if(o){let[,r]=(0,a.useState)(e);(0,a.useEffect)(()=>t.on("change",r),[])}return t}function c(e,t){let r=l(t()),i=()=>r.set(t());return i(),(0,n.useIsomorphicLayoutEffect)(()=>{let t=()=>o.frame.preRender(i,!1,!0),r=e.map(e=>e.on("change",t));return()=>{r.forEach(e=>e()),(0,o.cancelFrame)(i)}}),r}e.s(["useMotionValue",0,l],803534);function f(e,t){let o=(0,r.useConstant)(()=>[]);return c(e,()=>{o.length=0;let r=e.length;for(let t=0;t<r;t++)o[t]=e[t].get();return t(o)})}e.s(["useTransform",0,function e(o,n,a,s){if("function"==typeof o){let e;return i.collectMotionValues.current=[],o(),e=c(i.collectMotionValues.current,o),i.collectMotionValues.current=void 0,e}if(void 0!==a&&!Array.isArray(a)&&"function"!=typeof n){var l=o,u=n,d=a,h=s;let t=(0,r.useConstant)(()=>Object.keys(d)),i=(0,r.useConstant)(()=>({}));for(let r of t)i[r]=e(l,u,d[r],h);return i}let m="function"==typeof n?n:function(...e){let r=!Array.isArray(e[0]),o=r?0:-1,n=e[0+o],i=e[1+o],a=e[2+o],s=e[3+o],l=(0,t.interpolate)(i,a,s);return r?l(n):l}(n,a,s),p=Array.isArray(o)?f(o,m):f([o],([e])=>m(e)),g=Array.isArray(o)?void 0:o.accelerate;return g&&!g.isTransformed&&"function"!=typeof n&&Array.isArray(a)&&s?.clamp!==!1&&(p.accelerate={...g,times:n,keyframes:a,isTransformed:!0,...s?.ease?{ease:s.ease}:{}}),p}],508324)},885341,e=>{"use strict";var t=e.i(623157),r=e.i(613352);let o={patchSize:1,threadR:.009,cotton:1,threadColor:"#efe7d2",stitchMix:.3,machine:0,period:.13,stitchLen:.033,weave:.7,swayAmp:1,swaySpeed:.4,seed:null,fallbackProgress:1},n=`attribute vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`,i=`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
}`,a=new WeakMap;e.s(["MuraqqaaHeroBackdrop",0,function({className:e,progressRef:s,progress:l,config:c}){let f=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e,t=f.current;if(!t)return;let r=a.get(t);void 0!==r&&window.clearTimeout(r),a.delete(t);let u=t.getContext("webgl",{antialias:!1});if(!u)return;let d=window.matchMedia("(prefers-reduced-motion: reduce)").matches,h={...o,...c},m=h.seed??Math.floor(100*Math.random())+1,p=(e,t)=>{let r=u.createShader(e);return u.shaderSource(r,t),u.compileShader(r),r},g=u.createProgram(),v=p(u.VERTEX_SHADER,n),w=p(u.FRAGMENT_SHADER,i);u.attachShader(g,v),u.attachShader(g,w),u.linkProgram(g),u.deleteShader(v),u.deleteShader(w),u.useProgram(g);let y=u.createBuffer();u.bindBuffer(u.ARRAY_BUFFER,y),u.bufferData(u.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),u.STATIC_DRAW);let x=u.getAttribLocation(g,"a_position");u.enableVertexAttribArray(x),u.vertexAttribPointer(x,2,u.FLOAT,!1,0,0);let _={res:u.getUniformLocation(g,"u_res"),time:u.getUniformLocation(g,"u_time"),progress:u.getUniformLocation(g,"u_progress"),seed:u.getUniformLocation(g,"u_seed"),stitchMix:u.getUniformLocation(g,"u_stitchMix"),cotton:u.getUniformLocation(g,"u_cotton"),machine:u.getUniformLocation(g,"u_machine"),threadR:u.getUniformLocation(g,"u_threadR"),period:u.getUniformLocation(g,"u_period"),stitchLen:u.getUniformLocation(g,"u_stitchLen"),swayAmp:u.getUniformLocation(g,"u_swayAmp"),swaySpeed:u.getUniformLocation(g,"u_swaySpeed"),weave:u.getUniformLocation(g,"u_weave"),rows:u.getUniformLocation(g,"u_rows"),threadColor:u.getUniformLocation(g,"u_threadColor")},[b,E,A]=[parseInt((e=h.threadColor.replace("#","")).slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255];u.uniform1f(_.seed,m),u.uniform1f(_.stitchMix,h.stitchMix),u.uniform1f(_.cotton,h.cotton),u.uniform1f(_.machine,h.machine),u.uniform1f(_.threadR,h.threadR),u.uniform1f(_.period,h.period),u.uniform1f(_.stitchLen,h.stitchLen),u.uniform1f(_.swayAmp,h.swayAmp),u.uniform1f(_.swaySpeed,h.swaySpeed),u.uniform1f(_.weave,h.weave),u.uniform1f(_.rows,8/Math.max(.1,h.patchSize)),u.uniform3f(_.threadColor,b,E,A);let L=t.getBoundingClientRect(),R=0,C="visible"===document.visibilityState,T=!0,M=!1,S=performance.now(),k=!d&&0!==h.swayAmp&&0!==h.swaySpeed,P=()=>{let e=Math.min(window.devicePixelRatio||1,2),r=Math.max(1,Math.round(L.width*e)),o=Math.max(1,Math.round(L.height*e)),n=Math.min(1,Math.sqrt(2e6/Math.max(1,r*o))),i=Math.max(1,Math.round(r*n)),a=Math.max(1,Math.round(o*n));(t.width!==i||t.height!==a)&&(t.width=i,t.height=a,u.viewport(0,0,i,a))};function H(){!M&&C&&T&&0===R&&(R=requestAnimationFrame(O))}let F=()=>{L=t.getBoundingClientRect(),P(),H()};window.addEventListener("resize",F);let N=new ResizeObserver(F);N.observe(t);let I=new IntersectionObserver(([e])=>{(T=e?.isIntersecting??!0)?H():0!==R&&(cancelAnimationFrame(R),R=0)});I.observe(t);let W=()=>{(C="visible"===document.visibilityState)?H():0!==R&&(cancelAnimationFrame(R),R=0)};document.addEventListener("visibilitychange",W);let z=l?.on("change",H);function O(e){R=0,!M&&C&&T&&u&&(P(),u.uniform2f(_.res,t.width,t.height),u.uniform1f(_.time,d||!k?0:(e-S)/1e3),u.uniform1f(_.progress,d?1:l?.get()??s?.current??h.fallbackProgress),u.drawArrays(u.TRIANGLES,0,3),k&&H())}return H(),()=>{M=!0,cancelAnimationFrame(R),N.disconnect(),I.disconnect(),z?.(),document.removeEventListener("visibilitychange",W),window.removeEventListener("resize",F),u.deleteBuffer(y),u.deleteProgram(g);let e=window.setTimeout(()=>{a.get(t)===e&&(a.delete(t),u.getExtension("WEBGL_lose_context")?.loseContext(),t.width=1,t.height=1)},0);a.set(t,e)}},[]),(0,t.jsx)("canvas",{ref:f,"aria-hidden":!0,className:e,style:{display:"block",width:"100%",height:"100%"}})}])},553582,e=>{"use strict";var t=e.i(623157),r=e.i(613352);let o=[{amount:60,unit:"second"},{amount:60,unit:"minute"},{amount:24,unit:"hour"},{amount:7,unit:"day"},{amount:4.34524,unit:"week"},{amount:12,unit:"month"},{amount:1/0,unit:"year"}];e.s(["RelativeTime",0,function({iso:e,locale:n="en"}){let i=new Intl.DateTimeFormat(n,{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(e)),[a,s]=(0,r.useState)(i);return(0,r.useEffect)(()=>{s(function(e,t){let r=new Intl.RelativeTimeFormat(t,{numeric:"auto"}),n=(new Date(e).getTime()-Date.now())/1e3;for(let e of o){if(Math.abs(n)<e.amount)return r.format(Math.round(n),e.unit);n/=e.amount}return""}(e,n))},[e,n]),(0,t.jsx)("time",{dateTime:e,title:i,children:a})}])},243479,e=>{"use strict";var t=e.i(623157),r=e.i(707524),o=e.i(114168),n=e.i(587816),i=e.i(508324),a=e.i(613352);function s(e){let t=43758.5453*Math.sin(12.9898*e);return t-Math.floor(t)}e.s(["FloatingParticles",0,function({count:e=18,className:n}){let i=(0,o.useReducedMotion)()??!1,l=(0,a.useMemo)(()=>Array.from({length:e},(e,t)=>({left:`${(96*s(t+1)+2).toFixed(2)}%`,top:`${(90*s(t+101)+5).toFixed(2)}%`,size:+(1+2*s(t+201)).toFixed(2),duration:+(7+9*s(t+301)).toFixed(2),delay:+(-12*s(t+401)).toFixed(2),drift:+(8+18*s(t+501)).toFixed(2)})),[e]);return(0,t.jsx)("div",{className:n,style:{position:"absolute",inset:0,pointerEvents:"none"},"aria-hidden":!0,children:l.map((e,o)=>(0,t.jsx)(r.motion.span,{style:{position:"absolute",left:e.left,top:e.top,width:e.size,height:e.size,borderRadius:"50%",background:"var(--kk-halo-c)",opacity:i?.15:void 0},animate:i?void 0:{y:[0,-e.drift,0],opacity:[.08,.35,.08]},transition:i?void 0:{duration:e.duration,delay:e.delay,repeat:1/0,ease:"easeInOut"}},o))})},"Parallax",0,function({children:e,range:s=24,className:l}){let c=(0,o.useReducedMotion)()??!1,f=(0,a.useRef)(null),{scrollYProgress:u}=(0,n.useScroll)({target:f,offset:["start end","end start"]}),d=(0,i.useTransform)(u,[0,1],[s,-s]);return(0,t.jsx)(r.motion.div,{ref:f,className:l,style:{y:c?0:d},children:e})}])},184516,e=>{"use strict";var t=e.i(623157),r=e.i(613352),o=e.i(707524),n=e.i(114168),i=e.i(587816),a=e.i(508324),s=e.i(885341);e.s(["FooterCloth",0,function({height:e="clamp(240px, 38vh, 420px)"}){let l=(0,r.useRef)(null),c=(0,n.useReducedMotion)()??!1,{scrollYProgress:f}=(0,i.useScroll)({target:l,offset:["start end","end end"]}),u=(0,a.useTransform)(f,[0,1],["inset(100% 0 0 0)","inset(0% 0 0 0)"]);return(0,t.jsx)(o.motion.div,{ref:l,"aria-hidden":!0,style:{height:e,pointerEvents:"none",clipPath:c?"inset(0% 0 0 0)":u,maskImage:"linear-gradient(to bottom, transparent, black 55%)",WebkitMaskImage:"linear-gradient(to bottom, transparent, black 55%)"},children:(0,t.jsx)(s.MuraqqaaHeroBackdrop,{className:"h-full w-full",progress:f,config:{patchSize:2,seed:29,swayAmp:0,swaySpeed:0,fallbackProgress:1}})})}])}]);