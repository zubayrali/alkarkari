import rough from "roughjs";
import { getStroke } from "perfect-freehand";
import type { ExcalidrawData, ExcalidrawElement, ExcalidrawRenderOptions } from "./excalidraw-types";

const gen = rough.generator();

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const FONT_FAMILIES: Record<number, string> = {
  1: "Virgil, Segoe UI Emoji, sans-serif",
  2: "Helvetica, Arial, sans-serif",
  3: "Cascadia, monospace",
  4: "Virgil, Segoe UI Emoji, sans-serif",
};

export interface RenderResult {
  svg: string;
  viewBox: { width: number; height: number; offsetX: number; offsetY: number };
}

export function renderToSvg(
  data: ExcalidrawData,
  opts: ExcalidrawRenderOptions = {},
): RenderResult {
  const elements = data.elements.filter((el) => !el.isDeleted);
  if (elements.length === 0) {
    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
      viewBox: { width: 100, height: 100, offsetX: 0, offsetY: 0 },
    };
  }

  const padding = opts.exportPadding ?? 20;
  const bbox = computeBoundingBox(elements);
  const width = Math.ceil(bbox.width + padding * 2);
  const height = Math.ceil(bbox.height + padding * 2);
  const offsetX = -bbox.minX + padding;
  const offsetY = -bbox.minY + padding;

  const bgColor = resolveBgColor(data, opts);
  const renderedElements = elements.map((el) => renderElement(el, data)).filter(Boolean);

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-bg-color="${escapeAttr(bgColor ?? "#ffffff")}">`,
    `<defs>${getFontDefs()}</defs>`,
    `<g transform="translate(${offsetX}, ${offsetY})">`,
    ...renderedElements,
    "</g>",
    "</svg>",
  ];

  return {
    svg: parts.filter(Boolean).join("\n"),
    viewBox: { width, height, offsetX, offsetY },
  };
}

function resolveBgColor(data: ExcalidrawData, opts: ExcalidrawRenderOptions): string | null {
  const exportBg = data.appState.exportBackground ?? true;
  if (!exportBg) return null;

  if (opts.darkMode === "dark") return "#1e1e1e";
  if (opts.darkMode === "light") return data.appState.viewBackgroundColor ?? "#ffffff";

  const rawBg = data.appState.viewBackgroundColor ?? "#ffffff";
  const lower = rawBg.toLowerCase();
  if (lower === "#ffffff" || lower === "#ffffffff") return "var(--excalidraw-bg, #ffffff)";
  return rawBg;
}

function renderElement(el: ExcalidrawElement, data: ExcalidrawData): string {
  const inner = renderElementInner(el, data);
  if (!inner) return "";

  const attrs: string[] = [];
  if (el.angle && el.angle !== 0) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const deg = (el.angle * 180) / Math.PI;
    attrs.push(`transform="rotate(${deg.toFixed(2)}, ${cx.toFixed(2)}, ${cy.toFixed(2)})"`);
  }
  if (el.opacity != null && el.opacity < 100) {
    attrs.push(`opacity="${el.opacity / 100}"`);
  }

  if (attrs.length > 0) {
    return `<g ${attrs.join(" ")}>${inner}</g>`;
  }
  return inner;
}

function renderElementInner(el: ExcalidrawElement, data: ExcalidrawData): string {
  switch (el.type) {
    case "rectangle":
      return renderRectangle(el);
    case "ellipse":
      return renderEllipse(el);
    case "diamond":
      return renderDiamond(el);
    case "line":
    case "arrow":
      return renderLinearElement(el);
    case "text":
      return renderText(el);
    case "freedraw":
      return renderFreedraw(el);
    case "image":
      return renderImage(el, data);
    case "frame":
    case "magicframe":
      return renderFrame(el);
    case "embeddable":
    case "iframe":
      return renderEmbeddable(el);
    default:
      return "";
  }
}

function themeColor(color: string): string {
  const lower = color.toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(lower)) {
    return `var(--excalidraw-color-${lower.slice(1)}, ${color})`;
  }
  return color;
}

function roughOpts(el: ExcalidrawElement) {
  return {
    seed: el.seed,
    roughness: el.roughness,
    stroke: el.strokeColor === "transparent" ? "none" : themeColor(el.strokeColor),
    strokeWidth: el.strokeWidth,
    fill: el.backgroundColor === "transparent" ? undefined : themeColor(el.backgroundColor),
    fillStyle: mapFillStyle(el.fillStyle),
    strokeLineDash: mapStrokeStyle(el.strokeStyle, el.strokeWidth),
  };
}

function mapFillStyle(style: string): string {
  switch (style) {
    case "hachure":
    case "cross-hatch":
    case "solid":
    case "zigzag":
    case "dots":
    case "dashed":
    case "zigzag-line":
      return style;
    default:
      return "hachure";
  }
}

function mapStrokeStyle(style: string, width: number): number[] | undefined {
  switch (style) {
    case "dashed":
      return [8 * width, 4 * width];
    case "dotted":
      return [1.5 * width, 4 * width];
    default:
      return undefined;
  }
}

function renderRectangle(el: ExcalidrawElement): string {
  const opts = roughOpts(el);
  const drawable = gen.rectangle(el.x, el.y, el.width, el.height, opts);
  return drawableToSvg(drawable);
}

function renderEllipse(el: ExcalidrawElement): string {
  const opts = roughOpts(el);
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const drawable = gen.ellipse(cx, cy, el.width, el.height, opts);
  return drawableToSvg(drawable);
}

function renderDiamond(el: ExcalidrawElement): string {
  const opts = roughOpts(el);
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = el.width / 2;
  const hh = el.height / 2;
  const points: Array<[number, number]> = [
    [cx, cy - hh],
    [cx + hw, cy],
    [cx, cy + hh],
    [cx - hw, cy],
  ];
  const drawable = gen.polygon(points, opts);
  return drawableToSvg(drawable);
}

function renderLinearElement(el: ExcalidrawElement): string {
  const points = el.points ?? [];
  if (points.length < 2) return "";

  const opts = {
    ...roughOpts(el),
    fill: undefined,
    fillStyle: undefined,
  };
  const absolutePoints: Array<[number, number]> = points.map(([px, py]) => [el.x + px, el.y + py]);

  let svg: string;
  if (points.length > 2) {
    const drawable = gen.curve(absolutePoints, opts);
    svg = drawableToSvg(drawable);
  } else {
    const drawable = gen.linearPath(absolutePoints, opts);
    svg = drawableToSvg(drawable);
  }

  if (el.type === "arrow") {
    svg += renderArrowheads(el, absolutePoints);
  }

  return svg;
}

function renderArrowheads(el: ExcalidrawElement, points: Array<[number, number]>): string {
  let svg = "";
  const color = el.strokeColor === "transparent" ? "none" : el.strokeColor;

  if (el.endArrowhead && el.endArrowhead !== "none" && points.length >= 2) {
    const tip = points[points.length - 1]!;
    const prev = points[points.length - 2]!;
    svg += renderArrowhead(prev, tip, color, el.strokeWidth);
  }

  if (el.startArrowhead && el.startArrowhead !== "none" && points.length >= 2) {
    const tip = points[0]!;
    const prev = points[1]!;
    svg += renderArrowhead(prev, tip, color, el.strokeWidth);
  }

  return svg;
}

function renderArrowhead(
  from: [number, number],
  to: [number, number],
  color: string,
  strokeWidth: number,
): string {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const headLen = 10 + strokeWidth * 2;
  const headAngle = Math.PI / 6;

  const x1 = to[0] - headLen * Math.cos(angle - headAngle);
  const y1 = to[1] - headLen * Math.sin(angle - headAngle);
  const x2 = to[0] - headLen * Math.cos(angle + headAngle);
  const y2 = to[1] - headLen * Math.sin(angle + headAngle);

  return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} L${to[0].toFixed(2)} ${to[1].toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${escapeAttr(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
}

function renderText(el: ExcalidrawElement): string {
  if (!el.text) return "";

  const fontFamily = FONT_FAMILIES[el.fontFamily ?? 1] ?? "Virgil, Segoe UI Emoji, sans-serif";
  const fontSize = el.fontSize ?? 20;
  const textAnchor = mapTextAlign(el.textAlign);
  const color =
    el.strokeColor === "transparent" ? "var(--excalidraw-fg, #000000)" : themeColor(el.strokeColor);

  const lines = el.text.split("\n");
  const lineHeight = fontSize * 1.25;
  const totalHeight = lines.length * lineHeight;

  let startY = el.y;
  if (el.verticalAlign === "middle") {
    startY = el.y + (el.height - totalHeight) / 2;
  } else if (el.verticalAlign === "bottom") {
    startY = el.y + el.height - totalHeight;
  }

  let textX = el.x;
  if (el.textAlign === "center") {
    textX = el.x + el.width / 2;
  } else if (el.textAlign === "right") {
    textX = el.x + el.width;
  }

  const tspans = lines
    .map((line, i) => {
      const y = startY + fontSize + i * lineHeight;
      return `<tspan x="${textX.toFixed(2)}" y="${y.toFixed(2)}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<text font-family="${escapeAttr(fontFamily)}" font-size="${fontSize}" fill="${escapeAttr(color)}" text-anchor="${textAnchor}" dominant-baseline="auto">${tspans}</text>`;
}

function mapTextAlign(align?: string): string {
  switch (align) {
    case "center":
      return "middle";
    case "right":
      return "end";
    default:
      return "start";
  }
}

function renderFreedraw(el: ExcalidrawElement): string {
  const points = el.points ?? [];
  if (points.length < 2) return "";

  const absolutePoints = points.map(
    ([px, py]) => [el.x + px, el.y + py, 0.5] as [number, number, number],
  );

  const strokePoints = getStroke(absolutePoints, {
    size: el.strokeWidth * 4.5,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: el.simulatePressure ?? true,
  });

  if (strokePoints.length < 2) return "";

  const d = getSvgPathFromStroke(strokePoints);
  const color =
    el.strokeColor === "transparent" ? "var(--excalidraw-fg, #000000)" : themeColor(el.strokeColor);

  return `<path d="${d}" fill="${escapeAttr(color)}" stroke="none" />`;
}

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 2) return "";

  const first = points[0]!;
  let d = `M${first[0]!.toFixed(2)} ${first[1]!.toFixed(2)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i]!;
    const next = points[i + 1]!;
    const mx = (curr[0]! + next[0]!) / 2;
    const my = (curr[1]! + next[1]!) / 2;
    d += ` Q${curr[0]!.toFixed(2)} ${curr[1]!.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

function renderImage(el: ExcalidrawElement, data: ExcalidrawData): string {
  if (!el.fileId) return "";

  const file = data.files[el.fileId];
  if (file?.dataURL) {
    return `<image x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" href="${escapeAttr(file.dataURL)}" preserveAspectRatio="xMidYMid meet" />`;
  }

  return "";
}

function renderFrame(el: ExcalidrawElement): string {
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="none" stroke="#aaaaaa" stroke-width="1" stroke-dasharray="5 5" />`;
}

function renderEmbeddable(el: ExcalidrawElement): string {
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="var(--excalidraw-bg, #f8f9fa)" stroke="var(--excalidraw-color-ced4da, #dee2e6)" stroke-width="2" rx="8" ry="8" data-embed-id="${el.id}" />`;
}

function drawableToSvg(drawable: ReturnType<typeof gen.rectangle>): string {
  const paths: string[] = [];

  for (const set of drawable.sets) {
    const d = opsToPath(set.ops);
    if (!d) continue;

    if (set.type === "path") {
      paths.push(
        `<path d="${d}" stroke="${escapeAttr(String(drawable.options.stroke ?? "none"))}" stroke-width="${drawable.options.strokeWidth ?? 1}" fill="none"${strokeDashAttr(drawable.options.strokeLineDash as number[] | undefined)} />`,
      );
    } else if (set.type === "fillPath") {
      paths.push(
        `<path d="${d}" fill="${escapeAttr(String(drawable.options.fill ?? "none"))}" stroke="none" />`,
      );
    } else if (set.type === "fillSketch") {
      paths.push(
        `<path d="${d}" stroke="${escapeAttr(String(drawable.options.fill ?? "none"))}" stroke-width="${((drawable.options.fillWeight ?? drawable.options.strokeWidth ?? 1) as number) * 0.5}" fill="none" />`,
      );
    }
  }

  return paths.join("\n");
}

function strokeDashAttr(dash: number[] | undefined): string {
  if (!dash || dash.length === 0) return "";
  return ` stroke-dasharray="${dash.join(" ")}"`;
}

function opsToPath(ops: Array<{ op: string; data: number[] }>): string {
  let d = "";
  for (const item of ops) {
    const p = item.data;
    switch (item.op) {
      case "move":
        d += `M${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)} `;
        break;
      case "lineTo":
        d += `L${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)} `;
        break;
      case "bcurveTo":
        d += `C${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)},${p[2]!.toFixed(2)} ${p[3]!.toFixed(2)},${p[4]!.toFixed(2)} ${p[5]!.toFixed(2)} `;
        break;
    }
  }
  return d.trim();
}

function computeBoundingBox(elements: ExcalidrawElement[]): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const corners = getElementCorners(el);
    for (const [cx, cy] of corners) {
      if (cx < minX) minX = cx;
      if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx;
      if (cy > maxY) maxY = cy;
    }
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function getElementCorners(el: ExcalidrawElement): Array<[number, number]> {
  if ((el.type === "line" || el.type === "arrow" || el.type === "freedraw") && el.points) {
    return el.points.map(([px, py]) => [el.x + px, el.y + py]);
  }

  const corners: Array<[number, number]> = [
    [el.x, el.y],
    [el.x + el.width, el.y],
    [el.x + el.width, el.y + el.height],
    [el.x, el.y + el.height],
  ];

  if (el.angle && el.angle !== 0) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    return corners.map(([x, y]) => rotatePoint(x, y, cx, cy, el.angle));
  }

  return corners;
}

function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number,
): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

function getFontDefs(): string {
  return `<style>
@font-face {
  font-family: "Virgil";
  src: url("https://unpkg.com/@excalidraw/excalidraw@0.17.0/dist/prod/Virgil-Regular-hO16.woff2") format("woff2");
}
</style>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
