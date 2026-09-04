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
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { patchOf } from '@/lib/patch';

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
  /** Section (top-level URL segment) — drives node colour via patchOf. */
  group?: string;
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

// Locale-prefixed: all locale builds share one origin, and node URLs are
// basePath-less, so an unprefixed key would tint pages "visited" across
// languages (see the i18n spec's per-locale details table).
const VISITED_KEY = `graph-visited:${process.env.NEXT_PUBLIC_SITE_LANGUAGE || 'en'}`;
/** How quickly labels appear as you zoom in; higher = appear later.
 *  Local graphs show labels near rest (few nodes, titles are the content);
 *  the global graph keeps them hidden until ~1.3× the fitted zoom — hundreds
 *  of overlapping titles at rest read as text soup. */
const LABEL_OPACITY_SCALE = { local: 0.6, global: 1.4 };
const LABEL_FONT_PX = 11;
const DIM_ALPHA = 0.12;
const TOOLTIP_EDGE_PADDING = 10;

interface LabelBox {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

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

function endpointId(endpoint: Link['source'] | Link['target']): string {
  return typeof endpoint === 'object' ? String(endpoint.id) : String(endpoint);
}

function displayGroup(group?: string): string | undefined {
  if (!group) return undefined;
  return group
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function boxesOverlap(a: LabelBox, b: LabelBox, padding: number): boolean {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

interface ThemeColors {
  current: Rgb;
  page: Rgb;
  tag: Rgb;
  label: Rgb;
  link: Rgb;
  /** Section → resolved patch colour (muraqqaʿa spectrum via patchOf). */
  groups: Record<string, Rgb>;
  /** Resolved font-family list for canvas labels (mono ledger face). */
  font: string;
}

function readThemeColors(container: HTMLElement, groups: string[]): ThemeColors {
  const style = getComputedStyle(container);
  const token = (name: string) => style.getPropertyValue(name);
  const muted = resolveColor(token('--color-fd-muted-foreground'));
  return {
    current: resolveColor(token('--color-fd-primary')),
    page: muted,
    tag: resolveColor(token('--graph-tag-color') || 'teal'),
    label: resolveColor(token('--color-fd-foreground')),
    link: muted,
    groups: Object.fromEntries(
      groups.map((group) => [
        group,
        resolveColor(token(`--graph-node-color-${patchOf(group)}`)),
      ]),
    ),
    font: token('--font-mono').trim() || 'monospace',
  };
}

/** Exponential approach toward a target alpha (smooth fades). Time-based
 *  (τ ≈ 85ms ≈ the old 0.18/frame at 60fps): a fixed per-frame factor runs
 *  2× fast on 120Hz displays and crawls through frame stalls. */
function tween(map: Map<string, number>, key: string, target: number, dt: number): number {
  const current = map.get(key) ?? target;
  const factor = 1 - Math.exp(-dt / 85);
  let next = current + (target - current) * factor;
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
  const [showDirections, setShowDirections] = useState(false);
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
      className={`not-prose group relative w-full max-w-full overflow-hidden graph-frame ${
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
          showDirections={showDirections}
        />
      )}
      <div className="absolute right-2 top-2 z-30 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {extraControls}
        {variant === 'local' && (
          <button
            type="button"
            aria-label="Show link directions"
            aria-pressed={showDirections}
            className="graph-btn"
            data-active={showDirections || undefined}
            onClick={() => setShowDirections((value) => !value)}
          >
            <ArrowRight className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          aria-label="Zoom to fit"
          className="graph-btn"
          onClick={() => fitRef.current?.()}
        >
          <Crosshair className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="graph-btn"
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
  showDirections,
}: {
  graph: Graph;
  variant: 'global' | 'local';
  currentUrl?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  size: { width: number; height: number };
  fitRef: RefObject<(() => void) | null>;
  showDirections: boolean;
}) {
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const hoveredRef = useRef<Node | null>(null);
  const selectedRef = useRef<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
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
  const tooltipMeasureRaf = useRef<number | null>(null);
  const hoverRaf = useRef<number | null>(null);
  const pendingHoverRef = useRef<Node | null>(null);
  const prefetchedRef = useRef(new Set<string>());
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const coarsePointerRef = useRef(false);
  const visibleLabelIdsRef = useRef(new Set<string>());

  // d3 mutates node objects (x/y/vx/vy); never hand it the RSC-owned props.
  const data = useMemo(() => structuredClone(graph), [graph]);

  const groups = useMemo(
    () =>
      [...new Set(data.nodes.map((node) => node.group))].filter(
        (group): group is string => Boolean(group),
      ),
    [data],
  );

  // Wall-clock frame delta for the time-based tween(), captured once per frame.
  const lastFrameRef = useRef(0);
  const frameDtRef = useRef(16);

  // Semantic zoom (aarnphm's √-law): solid marks scale as √zoom while
  // distances scale linearly, so gaps visibly open as you zoom in. Both refs
  // are stamped once per frame in onRenderFramePre.
  const relativeZoomRef = useRef(1);
  const visualScaleRef = useRef(1);

  // Density-aware label threshold: past 55 nodes, labels appear at the zoom
  // where ~40 nodes fill the view (nodes-in-view ∝ n/rz², and this formula's
  // log2 semantics put the start at rz = 2^(scale-1)); never earlier than the
  // variant's configured value.
  const labelOpacityScale = useMemo(() => {
    const base = LABEL_OPACITY_SCALE[variant];
    const n = data.nodes.length;
    return n > 55 ? Math.max(base, 1 + 0.5 * Math.log2(n / 40)) : base;
  }, [data, variant]);

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
      if (hoverRaf.current !== null) cancelAnimationFrame(hoverRaf.current);
      if (tooltipMeasureRaf.current !== null) cancelAnimationFrame(tooltipMeasureRaf.current);
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    setSelectedNode(null);
  }, [data]);

  useEffect(() => {
    coarsePointerRef.current = window.matchMedia('(pointer: coarse)').matches;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedNode(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    visitedRef.current = getVisited();

    const container = containerRef.current;
    if (!container) return;
    colorsRef.current = readThemeColors(container, groups);

    // Re-resolve theme tokens when light/dark mode flips.
    const observer = new MutationObserver(() => {
      colorsRef.current = readThemeColors(container, groups);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [containerRef, groups]);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (event: PointerEvent) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      suppressClickRef.current = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7) {
        suppressClickRef.current = true;
      }
    };
    const onPointerUp = () => {
      pointerStartRef.current = null;
    };

    container.addEventListener('pointerdown', onPointerDown, true);
    container.addEventListener('pointermove', onPointerMove, true);
    container.addEventListener('pointerup', onPointerUp, true);
    container.addEventListener('pointercancel', onPointerUp, true);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true);
      container.removeEventListener('pointermove', onPointerMove, true);
      container.removeEventListener('pointerup', onPointerUp, true);
      container.removeEventListener('pointercancel', onPointerUp, true);
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
    const hovered = hoveredRef.current ?? selectedRef.current;
    if (!hovered) return true;
    return (
      hovered.id === node.id || (hovered.neighbors ?? []).includes(node.id as string)
    );
  }, []);

  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const positionTooltip = useCallback(() => {
    const node = hoveredRef.current;
    const el = tooltipRef.current;
    const fg = graphRef.current;
    const container = containerRef.current;
    if (!node || !el || !fg || !container || draggingRef.current) return;
    if (node.x == null || node.y == null) return;

    const coords = fg.graph2ScreenCoords(node.x, node.y);
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const gap = 12;

    let left = coords.x - width / 2;
    let top = coords.y + gap;
    if (top + height > containerHeight - TOOLTIP_EDGE_PADDING) {
      top = coords.y - height - gap;
    }
    left = Math.min(
      Math.max(left, TOOLTIP_EDGE_PADDING),
      Math.max(TOOLTIP_EDGE_PADDING, containerWidth - width - TOOLTIP_EDGE_PADDING),
    );
    top = Math.min(
      Math.max(top, TOOLTIP_EDGE_PADDING),
      Math.max(TOOLTIP_EDGE_PADDING, containerHeight - height - TOOLTIP_EDGE_PADDING),
    );
    el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }, [containerRef]);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);

  const applyHover = useCallback(
    (node: Node | null) => {
      // react-force-graph can briefly emit `null` and then the same node again
      // while its throttled pointer-area canvas catches up. The clear timer
      // below absorbs the null, but rebuilding the same tooltip still toggled
      // visibility off for a measurement frame on every recovery — perceived
      // as flicker while the pointer moved inside one node. Same-node updates
      // only need a position refresh; keep the already measured tooltip visible.
      if (node && hoveredRef.current?.id === node.id) {
        const container = containerRef.current;
        if (container) container.style.cursor = 'pointer';
        positionTooltip();
        return;
      }

      hoveredRef.current = node;
      const container = containerRef.current;
      if (container) container.style.cursor = node ? 'pointer' : '';

      const el = tooltipRef.current;
      if (!el) return;

      if (node) {
        const titleEl = el.firstElementChild as HTMLElement | null;
        const descEl = el.lastElementChild as HTMLElement | null;
        if (titleEl) titleEl.textContent = node.text;
        if (descEl) {
          descEl.textContent = node.description ?? '';
          descEl.style.display = node.description ? '' : 'none';
        }
        el.style.display = '';
        el.style.visibility = 'hidden';
        if (tooltipMeasureRaf.current !== null) {
          cancelAnimationFrame(tooltipMeasureRaf.current);
        }
        tooltipMeasureRaf.current = requestAnimationFrame(() => {
          tooltipMeasureRaf.current = null;
          if (hoveredRef.current?.id !== node.id || draggingRef.current) return;
          positionTooltip();
          el.style.visibility = '';
        });

        if (!prefetchedRef.current.has(node.url)) {
          prefetchedRef.current.add(node.url);
          router.prefetch(node.url);
        }
      } else {
        hideTooltip();
      }
    },
    [containerRef, hideTooltip, positionTooltip, router],
  );

  const handleNodeHover = useCallback(
    (node: Node | null) => {
      pendingHoverRef.current = node;
      if (hoverRaf.current !== null) return;
      hoverRaf.current = requestAnimationFrame(() => {
        hoverRaf.current = null;
        const next = pendingHoverRef.current;

        if (hoverClearTimer.current) {
          clearTimeout(hoverClearTimer.current);
          hoverClearTimer.current = null;
        }

        if (next) {
          applyHover(next);
        } else {
          // The shadow canvas used for hit detection refreshes on an 800ms
          // throttle, so stale pixels can briefly report "nothing hovered"
          // while the cursor is still over a node. Delay the clear so these
          // false nulls don't flicker the UI.
          hoverClearTimer.current = setTimeout(() => applyHover(null), 120);
        }
      });
    },
    [applyHover],
  );

  const clearHover = useCallback(() => {
    pendingHoverRef.current = null;
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
    applyHover(null);
  }, [applyHover]);

  const nodeRadius = useCallback(
    (node: Node) => {
      const degree = node.neighbors?.length ?? 0;
      const isCurrent = currentUrl !== undefined && node.url === currentUrl;
      // 1.8× on √degree so hubs visually anchor their cluster (a 50-link hub
      // reads ~15px vs ~9px with the plain √) — gives the eye a hierarchy.
      return 2 + Math.sqrt(degree) * 1.8 + (isCurrent ? 1.5 : 0);
    },
    [currentUrl],
  );

  const hubDegree = Math.max(4, Math.ceil(Math.log2(Math.max(data.nodes.length, 2))));

  const labelPriority = useCallback(
    (node: Node) => {
      const focus = hoveredRef.current ?? selectedRef.current;
      if (node.url === currentUrl || node.id === focus?.id) return 6;
      if ((focus?.neighbors ?? []).includes(String(node.id))) return 5;
      if (node.kind === 'tag' || (node.neighbors?.length ?? 0) >= hubDegree) return 3;
      return 1;
    },
    [currentUrl, hubDegree],
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
    const isHovered = hoveredRef.current?.id === node.id;
    const isSelected = selectedRef.current?.id === node.id;
    const radius = nodeRadius(node) * visualScaleRef.current;
    const dt = frameDtRef.current;

    const active = isActive(node);
    const alpha = tween(nodeAlphas.current, id, active ? 1 : DIM_ALPHA, dt);

    const fill = isCurrent || isHovered || isSelected
      ? colors.current
      : node.kind === 'tag'
        ? colors.tag
        : (node.group && colors.groups[node.group]) || colors.page;

    // Visited pages keep their section colour but sit back a step — an alpha
    // dim instead of the old dedicated visited hue, which would erase the
    // section colouring for every page the reader has seen.
    const visitedDim =
      !isCurrent && !isHovered && !isSelected && visitedRef.current.has(node.url)
        ? 0.55
        : 1;

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = rgba(fill, alpha * visitedDim);
    ctx.fill();

    if (isCurrent || isSelected) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius + 1.5 / globalScale + 1, 0, 2 * Math.PI, false);
      ctx.strokeStyle = rgba(colors.current, (isSelected ? 0.7 : 0.45) * alpha);
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Zoom-faded labels (quartz formula): fade in as you zoom past baseline.
    const relativeZoom = relativeZoomRef.current;
    const zoomAlpha = Math.min(
      1,
      Math.max(0, Math.log2(relativeZoom) + 1 - labelOpacityScale),
    );

    const focused = hoveredRef.current !== null || selectedRef.current !== null;
    const priority = labelPriority(node);
    const visible = visibleLabelIdsRef.current.has(id);
    const baseTarget = priority >= 5 ? 1 : priority >= 3 ? Math.max(zoomAlpha, 0.7) : zoomAlpha;
    const labelTarget = !visible
      ? 0
      : focused
      ? active
        ? baseTarget
        : baseTarget * DIM_ALPHA
      : baseTarget;
    const labelAlpha = tween(labelAlphas.current, id, labelTarget, dt);

    if (labelAlpha > 0.01) {
      // Labels grow as √zoom (same law as nodes), capped at 1.5× so long
      // titles don't blow up into a wall of giant text at deep zoom.
      const fontSize = (LABEL_FONT_PX * Math.min(Math.sqrt(relativeZoom), 1.5)) / globalScale;
      ctx.font = `${fontSize}px ${colors.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = rgba(colors.label, labelAlpha);
      ctx.fillText(node.text, node.x!, node.y! + radius + 3 / globalScale);
    }
  };

  const linkColor = (link: Link) => {
    const colors = colorsRef.current;
    if (!colors) return 'rgba(128,128,128,0.3)';

    const hovered = hoveredRef.current ?? selectedRef.current;
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

    return rgba(color, tween(linkAlphas.current, key, alphaTarget, frameDtRef.current));
  };

  // Draw links trimmed at each node's radius so edges touch circles instead
  // of piercing through them — center-to-center lines turn hubs into
  // scribbles. Width is screen-constant (counter-scaled by zoom).
  const linkCanvasObject: ForceGraphProps<Node, Link>['linkCanvasObject'] = (
    link,
    ctx,
    globalScale,
  ) => {
    const source = link.source as Node;
    const target = link.target as Node;
    if (source.x == null || target.x == null) return;

    const dx = target.x - source.x;
    const dy = target.y! - source.y!;
    const dist = Math.hypot(dx, dy);
    const sourceRadius = nodeRadius(source) * visualScaleRef.current;
    const targetRadius = nodeRadius(target) * visualScaleRef.current;
    if (dist <= sourceRadius + targetRadius) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const color = linkColor(link);
    const endX = target.x - ux * targetRadius;
    const endY = target.y! - uy * targetRadius;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / globalScale;
    ctx.beginPath();
    ctx.moveTo(source.x + ux * sourceRadius, source.y! + uy * sourceRadius);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (variant === 'local' && showDirections) {
      const arrowSize = 4.5 / globalScale;
      const baseX = endX - ux * arrowSize * 2;
      const baseY = endY - uy * arrowSize * 2;
      const px = -uy * arrowSize;
      const py = ux * arrowSize;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(baseX + px, baseY + py);
      ctx.lineTo(baseX - px, baseY - py);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  };

  // Label-fade baseline = the zoom zoomToFit lands on, derived from the node
  // bounding box (same 32px padding) instead of sampling zoom() on a timer —
  // the old setTimeout(450) raced the 400ms fit animation and any user input.
  const computeFitZoom = useCallback(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of data.nodes) {
      if (node.x == null || node.y == null) continue;
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }
    if (minX === Infinity) return null;
    const pad = 32;
    return Math.min(8, Math.max(0.3, Math.min(
      (size.width - 2 * pad) / Math.max(maxX - minX, 1),
      (size.height - 2 * pad) / Math.max(maxY - minY, 1),
    )));
  }, [data, size.width, size.height]);

  useEffect(() => {
    // New dataset (navigation, depth change): re-arm one fresh auto-fit. The
    // actual fit happens as the layout settles (onEngineTick/onEngineStop).
    didAutoFitRef.current = false;
  }, [data]);

  const selectedStats = useMemo(() => {
    if (!selectedNode) return null;
    const id = String(selectedNode.id);
    let incoming = 0;
    let outgoing = 0;
    for (const link of data.links) {
      if (endpointId(link.source) === id) outgoing++;
      if (endpointId(link.target) === id) incoming++;
    }
    return {
      incoming,
      outgoing,
      connections: selectedNode.neighbors?.length ?? new Set(
        data.links.flatMap((link) => {
          const source = endpointId(link.source);
          const target = endpointId(link.target);
          if (source === id) return [target];
          if (target === id) return [source];
          return [];
        }),
      ).size,
    };
  }, [data.links, selectedNode]);

  const openNode = useCallback(
    (node: Node) => {
      recordVisited(node.url);
      visitedRef.current.add(node.url);
      router.push(node.url);
    },
    [router],
  );

  return (
    <>
      <ForceGraph2D<NodeType, LinkType>
        width={size.width}
        height={size.height}
        ref={fgRefObject.current}
        graphData={data}
        onRenderFramePre={(ctx, globalScale) => {
          const now = performance.now();
          frameDtRef.current = lastFrameRef.current
            ? Math.min(now - lastFrameRef.current, 100)
            : 16;
          lastFrameRef.current = now;

          const baseline = baselineZoomRef.current ?? globalScale;
          const rz = Math.max(globalScale / baseline, 1e-4);
          relativeZoomRef.current = rz;
          visualScaleRef.current = Math.min(Math.max(1 / Math.sqrt(rz), 0.25), 4);

          // Build a priority-ordered label layout before nodes paint. Important
          // labels claim space first; peripheral labels appear only as zoom
          // creates room, which prevents the global graph becoming text soup.
          const zoomAlpha = Math.min(
            1,
            Math.max(0, Math.log2(rz) + 1 - labelOpacityScale),
          );
          const fontSize = (LABEL_FONT_PX * Math.min(Math.sqrt(rz), 1.5)) / globalScale;
          ctx.font = `${fontSize}px ${colorsRef.current?.font ?? 'monospace'}`;
          const candidates = data.nodes
            .filter((node) => node.x != null && node.y != null)
            .map((node) => ({
              node,
              priority: labelPriority(node),
              degree: node.neighbors?.length ?? 0,
            }))
            .filter(({ priority }) => priority >= 3 || zoomAlpha > 0.04)
            .sort((a, b) => b.priority - a.priority || b.degree - a.degree);
          const boxes: LabelBox[] = [];
          const visible = new Set<string>();
          for (const { node, priority } of candidates) {
            const radius = nodeRadius(node) * visualScaleRef.current;
            const width = ctx.measureText(node.text).width;
            const top = node.y! + radius + 3 / globalScale;
            const box: LabelBox = {
              left: node.x! - width / 2,
              right: node.x! + width / 2,
              top,
              bottom: top + fontSize,
            };
            const overlaps = boxes.some((other) =>
              boxesOverlap(box, other, 3 / globalScale),
            );
            // Current/selected/hovered titles remain legible even in a knot;
            // every other label participates in collision suppression.
            if (!overlaps || priority >= 6) {
              boxes.push(box);
              visible.add(String(node.id));
            }
          }
          visibleLabelIdsRef.current = visible;
          positionTooltip();
        }}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeRadius(node) * visualScaleRef.current + 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={linkCanvasObject}
        onNodeHover={handleNodeHover}
        onNodeClick={(node) => {
          if (suppressClickRef.current || draggingRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (selectedRef.current?.id === node.id) {
            openNode(node);
            return;
          }
          setSelectedNode(node);
          // Touch always previews first. Desktop also retains the selection so
          // the reading card is useful; a second click or its action opens it.
          if (!coarsePointerRef.current) clearHover();
        }}
        onBackgroundClick={() => {
          setSelectedNode(null);
          clearHover();
        }}
        onNodeDrag={() => {
          draggingRef.current = true;
          suppressClickRef.current = true;
          clearHover();
        }}
        onNodeDragEnd={() => {
          draggingRef.current = false;
        }}
        onZoom={clearHover}
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
          // Label-fade baseline: the fit target, computed — not sampled later.
          baselineZoomRef.current = computeFitZoom();
        }}
        minZoom={0.3}
        // Zoom ceiling scales with graph size (√(n/4), capped 8..16): big
        // graphs need headroom to thin out to a readable label regime, but a
        // fixed high ceiling on a small graph just zooms into empty space.
        maxZoom={Math.min(16, Math.max(8, Math.sqrt(data.nodes.length / 4)))}
        autoPauseRedraw={false}
        enableNodeDrag
        enableZoomInteraction
      />
      <div
        ref={tooltipRef}
        className="graph-tooltip pointer-events-none absolute left-0 top-0 z-20 max-w-xs p-2 text-sm"
        style={{ display: 'none' }}
      >
        <div className="font-medium" />
        <div className="mt-0.5 text-xs text-fd-muted-foreground" />
      </div>
      {selectedNode && selectedStats && (
        <aside
          className={`graph-node-card graph-node-card--${variant}`}
          aria-label={`Selected node: ${selectedNode.text}`}
        >
          <div className="graph-node-card__actions">
            <button
              type="button"
              className="graph-node-card__open"
              aria-label="Open page"
              title="Open page"
              onClick={() => openNode(selectedNode)}
            >
              <ArrowUpRight className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className="graph-node-card__close"
              aria-label="Clear selected node"
              title="Close preview"
              onClick={() => setSelectedNode(null)}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="graph-node-card__eyebrow">
            <span>
              {selectedNode.kind === 'tag'
                ? 'Tag'
                : displayGroup(selectedNode.group) ?? 'Page'}
            </span>
          </div>
          <div className="graph-node-card__title">{selectedNode.text}</div>
          {selectedNode.description && (
            <p className="graph-node-card__description">{selectedNode.description}</p>
          )}
          <div className="graph-node-card__stats" aria-label="Connection statistics">
            <span>{selectedStats.connections} links</span>
            <span aria-label={`${selectedStats.incoming} incoming links`}>
              ↓ {selectedStats.incoming}
            </span>
            <span aria-label={`${selectedStats.outgoing} outgoing links`}>
              ↑ {selectedStats.outgoing}
            </span>
          </div>
        </aside>
      )}
    </>
  );
}
