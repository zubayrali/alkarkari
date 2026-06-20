'use client';
import {
  lazy,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ForceGraphMethods,
  ForceGraphProps,
  LinkObject,
  NodeObject,
} from 'react-force-graph-2d';
import { forceCollide, forceLink, forceManyBody, forceRadial } from 'd3-force';
import { useRouter } from 'fumadocs-core/framework';
import { Crosshair, Maximize2, Minimize2 } from 'lucide-react';

// Graph rendering behaviors (degree-sized nodes, zoom-faded labels,
// focus-on-hover dimming, visited tint, radial layout for the global view)
// are ported from aarnphm/quartz graph.inline.ts onto react-force-graph-2d.

export interface Graph {
  links: Link[];
  nodes: Node[];
}

export type Node = NodeObject<NodeType>;
export type Link = LinkObject<NodeType, LinkType>;

export interface NodeType {
  text: string;
  description?: string;
  neighbors?: string[];
  url: string;
  kind?: 'page' | 'tag';
}

export type LinkType = Record<string, unknown>;

export interface GraphViewProps {
  graph: Graph;
  variant?: 'global' | 'local';
  /** Highlighted as the current page (ring + accent color). */
  currentUrl?: string;
  className?: string;
  extraControls?: ReactNode;
}

const ForceGraph2D = lazy(
  () => import('react-force-graph-2d'),
) as typeof import('react-force-graph-2d').default;

const VISITED_KEY = 'graph-visited';
/** How quickly labels appear as you zoom in; higher = appear later. */
const LABEL_OPACITY_SCALE = 0.6;
const LABEL_FONT_PX = 11;
const DIM_ALPHA = 0.12;

function getVisited(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function recordVisited(url: string) {
  try {
    const visited = getVisited();
    visited.add(url);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
  } catch {
    // localStorage unavailable (private mode) — visited tint just won't persist
  }
}

type Rgb = [number, number, number];

let colorCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Resolve any CSS color (oklch, hsl, var()…) to 8-bit sRGB components.
 * getComputedStyle returns `rgb()` for some tokens but `oklch()` for Tailwind
 * v4 colors — parsing numbers out of the latter yields 0–1 floats, not 0–255.
 * Painting onto a 1×1 canvas normalizes every color form to sRGB bytes.
 */
function resolveColor(value: string): Rgb {
  const probe = document.createElement('div');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color || value;
  probe.remove();

  if (colorCtx === undefined) {
    colorCtx = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
  }
  if (colorCtx) {
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#808080'; // fallback if `resolved` is invalid
    colorCtx.fillStyle = resolved;
    colorCtx.fillRect(0, 0, 1, 1);
    const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  }

  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [128, 128, 128];
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ThemeColors {
  current: Rgb;
  visited: Rgb;
  page: Rgb;
  tag: Rgb;
  label: Rgb;
  link: Rgb;
}

function readThemeColors(container: HTMLElement): ThemeColors {
  const style = getComputedStyle(container);
  const token = (name: string) => style.getPropertyValue(name);
  const primary = resolveColor(token('--color-fd-primary'));
  const muted = resolveColor(token('--color-fd-muted-foreground'));
  return {
    current: primary,
    visited: [
      Math.round((primary[0] + muted[0]) / 2),
      Math.round((primary[1] + muted[1]) / 2),
      Math.round((primary[2] + muted[2]) / 2),
    ],
    page: muted,
    tag: resolveColor(token('--color-teal-500') || 'teal'),
    label: resolveColor(token('--color-fd-foreground')),
    link: muted,
  };
}

/** Per-frame exponential approach toward a target alpha (smooth fades). */
function tween(map: Map<string, number>, key: string, target: number): number {
  const current = map.get(key) ?? target;
  let next = current + (target - current) * 0.18;
  if (Math.abs(next - target) < 0.01) next = target;
  map.set(key, next);
  return next;
}

function useContainerSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export function GraphView({
  graph,
  variant = 'global',
  currentUrl,
  className,
  extraControls,
}: GraphViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const size = useContainerSize(ref);

  useEffect(() => {
    setMount(true);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const fitRef = useRef<(() => void) | null>(null);

  return (
    <div
      ref={ref}
      className={`not-prose group relative w-full max-w-full overflow-hidden rounded-xl border bg-fd-background ${
        className ?? 'h-[min(600px,70vh)]'
      }`}
    >
      {mount && size.width > 0 && (
        <ClientOnly
          graph={graph}
          variant={variant}
          currentUrl={currentUrl}
          containerRef={ref}
          size={size}
          fitRef={fitRef}
        />
      )}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {extraControls}
        <button
          type="button"
          aria-label="Zoom to fit"
          className="rounded-md border bg-fd-background/80 p-1.5 text-fd-muted-foreground backdrop-blur hover:text-fd-foreground"
          onClick={() => fitRef.current?.()}
        >
          <Crosshair className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="rounded-md border bg-fd-background/80 p-1.5 text-fd-muted-foreground backdrop-blur hover:text-fd-foreground"
          onClick={() => {
            if (document.fullscreenElement === ref.current) {
              void document.exitFullscreen();
            } else {
              void ref.current?.requestFullscreen();
            }
          }}
        >
          {fullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function fitGraph(
  graph: ForceGraphMethods<Node, Link> | undefined,
  duration = 400,
) {
  graph?.zoomToFit(duration, 32);
}

function ClientOnly({
  containerRef,
  graph,
  variant,
  currentUrl,
  size,
  fitRef,
}: {
  graph: Graph;
  variant: 'global' | 'local';
  currentUrl?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  size: { width: number; height: number };
  fitRef: RefObject<(() => void) | null>;
}) {
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const hoveredRef = useRef<Node | null>(null);
  const colorsRef = useRef<ThemeColors | null>(null);
  const visitedRef = useRef<Set<string>>(new Set());
  const baselineZoomRef = useRef<number | null>(null);
  // Auto-fit happens once per dataset; afterwards pan/zoom belongs to the
  // user (dragging reheats the simulation, and refitting on every engine
  // stop would yank the view back out).
  const didAutoFitRef = useRef(false);
  const nodeAlphas = useRef(new Map<string, number>());
  const labelAlphas = useRef(new Map<string, number>());
  const linkAlphas = useRef(new Map<string, number>());
  const router = useRouter();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // d3 mutates node objects (x/y/vx/vy); never hand it the RSC-owned props.
  const data = useMemo(() => structuredClone(graph), [graph]);

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    };
  }, []);

  useEffect(() => {
    visitedRef.current = getVisited();

    const container = containerRef.current;
    if (!container) return;
    colorsRef.current = readThemeColors(container);

    // Re-resolve theme tokens when light/dark mode flips.
    const observer = new MutationObserver(() => {
      colorsRef.current = readThemeColors(container);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    fitRef.current = () => fitGraph(graphRef.current);
  }, [fitRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // The warmup auto-fit (onEngineTick) keeps recentering the view for the
    // whole cooldown (~15s), which would override any pan/zoom the user tries
    // in that window. The moment they actually interact, hand control over:
    // stop auto-fitting and freeze the current zoom as the label baseline.
    const release = () => {
      if (didAutoFitRef.current) return;
      didAutoFitRef.current = true;
      baselineZoomRef.current = graphRef.current?.zoom() ?? null;
    };
    // Capture phase is required: d3-zoom/d3-drag call stopImmediatePropagation
    // on the canvas, so a bubble-phase listener on this ancestor would never
    // see the wheel/pointer events. Capture runs on ancestors first.
    const opts = { capture: true, passive: true } as const;
    container.addEventListener('wheel', release, opts);
    container.addEventListener('pointerdown', release, opts);
    return () => {
      container.removeEventListener('wheel', release, opts);
      container.removeEventListener('pointerdown', release, opts);
    };
  }, [containerRef]);

  // Apply the layout forces to a fresh graph instance. Held in a ref so the
  // stable ref object below can call the latest version without changing its
  // own identity.
  const configure = useCallback(
    (fg: ForceGraphMethods<Node, Link>) => {
      fg.d3Force('link', forceLink().distance(variant === 'local' ? 60 : 90));
      fg.d3Force(
        'charge',
        forceManyBody().strength(variant === 'local' ? -80 : -120),
      );
      fg.d3Force(
        'collision',
        forceCollide<Node>(
          (node) => 10 + Math.sqrt(node.neighbors?.length ?? 0) * 4,
        ),
      );
      if (variant === 'global') {
        // Radial gravity keeps disconnected clusters from drifting away.
        fg.d3Force(
          'radial',
          forceRadial((Math.min(size.width, size.height) / 2) * 0.8).strength(
            0.05,
          ),
        );
      }
    },
    [variant, size.width, size.height],
  );
  const configureRef = useRef(configure);
  configureRef.current = configure;

  // The ref object react-force-graph expects (MutableRefObject shape).
  // Created ONCE — a new ref identity each render would make React re-run the
  // setter, re-applying forces and refitting the view on every hover-driven
  // re-render (that was the "hover zooms out" bug).
  const fgRefObject = useRef<{
    current: ForceGraphMethods<Node, Link> | undefined;
  }>(null);
  if (!fgRefObject.current) {
    fgRefObject.current = {
      get current() {
        return graphRef.current;
      },
      set current(fg: ForceGraphMethods<Node, Link> | undefined) {
        graphRef.current = fg;
        if (fg) configureRef.current(fg);
      },
    };
  }

  const isActive = useCallback((node: Node): boolean => {
    const hovered = hoveredRef.current;
    if (!hovered) return true;
    return (
      hovered.id === node.id || (hovered.neighbors ?? []).includes(node.id as string)
    );
  }, []);

  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyHover = useCallback(
    (node: Node | null) => {
      hoveredRef.current = node;
      const container = containerRef.current;
      if (container) container.style.cursor = node ? 'pointer' : '';

      const el = tooltipRef.current;
      if (!el) return;

      if (node) {
        const fg = graphRef.current;
        if (fg) {
          const coords = fg.graph2ScreenCoords(node.x!, node.y!);
          el.style.top = `${coords.y + 8}px`;
          el.style.left = `${coords.x + 8}px`;
          el.style.display = '';
          const titleEl = el.firstElementChild as HTMLElement | null;
          const descEl = el.lastElementChild as HTMLElement | null;
          if (titleEl) titleEl.textContent = node.text;
          if (descEl) {
            descEl.textContent = node.description ?? '';
            descEl.style.display = node.description ? '' : 'none';
          }
        }
      } else {
        el.style.display = 'none';
      }
    },
    [containerRef],
  );

  const handleNodeHover = useCallback(
    (node: Node | null) => {
      if (hoverClearTimer.current) {
        clearTimeout(hoverClearTimer.current);
        hoverClearTimer.current = null;
      }

      if (node) {
        applyHover(node);
      } else {
        // The shadow canvas used for hit detection refreshes on an 800ms
        // throttle, so stale pixels can briefly report "nothing hovered"
        // while the cursor is still over a node. Delay the clear so these
        // false nulls don't flicker the UI.
        hoverClearTimer.current = setTimeout(() => applyHover(null), 120);
      }
    },
    [applyHover],
  );

  const nodeRadius = useCallback(
    (node: Node) => {
      const degree = node.neighbors?.length ?? 0;
      const isCurrent = currentUrl !== undefined && node.url === currentUrl;
      return 2 + Math.sqrt(degree) + (isCurrent ? 1.5 : 0);
    },
    [currentUrl],
  );

  const nodeCanvasObject: ForceGraphProps<Node, Link>['nodeCanvasObject'] = (
    node,
    ctx,
    globalScale,
  ) => {
    const colors = colorsRef.current;
    if (!colors) return;

    const id = node.id as string;
    const isCurrent = currentUrl !== undefined && node.url === currentUrl;
    const radius = nodeRadius(node);

    const active = isActive(node);
    const alpha = tween(nodeAlphas.current, id, active ? 1 : DIM_ALPHA);

    const fill = isCurrent
      ? colors.current
      : node.kind === 'tag'
        ? colors.tag
        : visitedRef.current.has(node.url)
          ? colors.visited
          : colors.page;

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = rgba(fill, alpha);
    ctx.fill();

    if (isCurrent) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius + 1.5 / globalScale + 1, 0, 2 * Math.PI, false);
      ctx.strokeStyle = rgba(colors.current, 0.45 * alpha);
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Zoom-faded labels (quartz formula): fade in as you zoom past baseline.
    const baseline = baselineZoomRef.current ?? globalScale;
    const relativeZoom = Math.max(globalScale / baseline, 1e-4);
    const zoomAlpha = Math.min(
      1,
      Math.max(0, Math.log2(relativeZoom) + 1 - LABEL_OPACITY_SCALE),
    );

    const hovered = hoveredRef.current !== null;
    const labelTarget = hovered
      ? active
        ? 1
        : zoomAlpha * DIM_ALPHA
      : zoomAlpha;
    const labelAlpha = tween(labelAlphas.current, id, labelTarget);

    if (labelAlpha > 0.01) {
      const fontSize = LABEL_FONT_PX / globalScale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = rgba(colors.label, labelAlpha);
      ctx.fillText(node.text, node.x!, node.y! + radius + 3 / globalScale);
    }
  };

  const linkColor = (link: Link) => {
    const colors = colorsRef.current;
    if (!colors) return 'rgba(128,128,128,0.3)';

    const hovered = hoveredRef.current;
    const source = link.source as Node;
    const target = link.target as Node;
    const key = `${source.id}|${target.id}`;

    let alphaTarget = 0.25;
    let color = colors.link;
    if (hovered) {
      const active = hovered.id === source.id || hovered.id === target.id;
      alphaTarget = active ? 0.9 : 0.05;
      if (active) color = colors.current;
    }

    return rgba(color, tween(linkAlphas.current, key, alphaTarget));
  };

  useEffect(() => {
    // New dataset (navigation, depth change): re-arm one fresh auto-fit. The
    // actual fit happens as the layout settles (onEngineTick/onEngineStop).
    didAutoFitRef.current = false;
  }, [data]);

  return (
    <>
      <ForceGraph2D<NodeType, LinkType>
        width={size.width}
        height={size.height}
        ref={fgRefObject.current}
        graphData={data}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeRadius(node) + 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={linkColor}
        onNodeHover={handleNodeHover}
        onNodeClick={(node) => {
          recordVisited(node.url);
          router.push(node.url);
        }}
        onEngineTick={() => {
          // Keep the view fitted *while* the layout expands during warmup, so
          // it reads as centered from the first frame instead of snapping into
          // place only once the simulation stops. Stops after the auto-fit.
          if (!didAutoFitRef.current) fitGraph(graphRef.current, 0);
        }}
        onEngineStop={() => {
          if (didAutoFitRef.current) return;
          didAutoFitRef.current = true;
          fitGraph(graphRef.current);
          // Record the post-fit zoom as the label-fade baseline.
          window.setTimeout(() => {
            baselineZoomRef.current = graphRef.current?.zoom() ?? null;
          }, 450);
        }}
        minZoom={0.3}
        maxZoom={8}
        linkWidth={1.5}
        autoPauseRedraw={false}
        enableNodeDrag
        enableZoomInteraction
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 max-w-xs rounded-lg border bg-fd-popover p-2 text-sm text-fd-popover-foreground shadow-lg"
        style={{ display: 'none' }}
      >
        <div className="font-medium" />
        <div className="mt-0.5 text-xs text-fd-muted-foreground" />
      </div>
    </>
  );
}
