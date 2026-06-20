"use client";

import { useCallback, useEffect, useRef } from "react";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;

interface ExcalidrawViewerProps {
  svgHtml: string;
  bgColor?: string;
}

export function ExcalidrawViewer({ svgHtml, bgColor }: ExcalidrawViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom: 1, panX: 0, panY: 0, isDragging: false, startX: 0, startY: 0, lastTouchDist: 0 });

  const applyTransform = useCallback(() => {
    const container = containerRef.current;
    const svg = container?.querySelector("svg");
    if (!svg) return;
    const { zoom, panX, panY } = stateRef.current;
    svg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const s = stateRef.current;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      s.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s.zoom + delta));
      applyTransform();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      s.isDragging = true;
      s.startX = e.clientX - s.panX;
      s.startY = e.clientY - s.panY;
      container.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!s.isDragging) return;
      s.panX = e.clientX - s.startX;
      s.panY = e.clientY - s.startY;
      applyTransform();
    };

    const handleMouseUp = () => {
      s.isDragging = false;
      container.style.cursor = "grab";
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        s.isDragging = true;
        s.startX = e.touches[0]!.clientX - s.panX;
        s.startY = e.touches[0]!.clientY - s.panY;
      } else if (e.touches.length === 2) {
        s.isDragging = false;
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        s.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && s.isDragging) {
        s.panX = e.touches[0]!.clientX - s.startX;
        s.panY = e.touches[0]!.clientY - s.startY;
        applyTransform();
      } else if (e.touches.length === 2 && s.lastTouchDist > 0) {
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / s.lastTouchDist;
        s.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s.zoom * scale));
        s.lastTouchDist = dist;
        applyTransform();
      }
    };

    const handleTouchEnd = () => {
      s.isDragging = false;
      s.lastTouchDist = 0;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [applyTransform]);

  const zoomIn = () => {
    stateRef.current.zoom = Math.min(MAX_ZOOM, stateRef.current.zoom + ZOOM_STEP);
    applyTransform();
  };
  const zoomOut = () => {
    stateRef.current.zoom = Math.max(MIN_ZOOM, stateRef.current.zoom - ZOOM_STEP);
    applyTransform();
  };
  const reset = () => {
    stateRef.current.zoom = 1;
    stateRef.current.panX = 0;
    stateRef.current.panY = 0;
    applyTransform();
  };

  return (
    <div className="excalidraw-page">
      <div className="excalidraw-controls">
        <button type="button" aria-label="Zoom in" onClick={zoomIn}>+</button>
        <button type="button" aria-label="Zoom out" onClick={zoomOut}>−</button>
        <button type="button" aria-label="Reset view" onClick={reset}>⟲</button>
      </div>
      <div
        ref={containerRef}
        className="excalidraw-container"
        style={{ backgroundColor: bgColor ?? "var(--excalidraw-bg, var(--fd-background))" }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
}
