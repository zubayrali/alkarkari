'use client';

import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export function SlideViewer({
  children,
  parentUrl,
  parentTitle,
}: {
  children: ReactNode;
  parentUrl: string;
  parentTitle: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slides, setSlides] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const nodes = Array.from(el.children);
    const sections: HTMLElement[][] = [[]];

    for (const node of nodes) {
      if (node instanceof HTMLElement && /^H[12]$/.test(node.tagName)) {
        if (sections[sections.length - 1].length > 0) {
          sections.push([]);
        }
      }
      if (node instanceof HTMLElement) {
        sections[sections.length - 1].push(node);
      }
    }

    const htmlSlides = sections
      .filter((s) => s.length > 0)
      .map((s) => s.map((n) => n.outerHTML).join(''));

    setSlides(htmlSlides);

    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < htmlSlides.length) setCurrent(idx);
    }
  }, []);

  const go = useCallback(
    (delta: number) => {
      setCurrent((prev) => {
        const next = Math.max(0, Math.min(slides.length - 1, prev + delta));
        queueMicrotask(() => history.replaceState(null, '', `#slide-${next + 1}`));
        return next;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        router.push(parentUrl);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [go, router, parentUrl]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;
      touchStartRef.current = null;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      go(dx < 0 ? 1 : -1);
    },
    [go],
  );

  return (
    <>
      <div ref={containerRef} className="hidden">
        {children}
      </div>

      {slides.length > 0 && (
        <div
          className="slide-viewer"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="slide-progress">
            <div
              className="slide-progress-fill"
              style={{ width: `${((current + 1) / slides.length) * 100}%` }}
            />
          </div>

          <div className="slide-content prose prose-fd">
            <div
              key={current}
              className="slide-body"
              dangerouslySetInnerHTML={{ __html: slides[current] }}
            />
          </div>

          <div className="slide-controls">
            <button
              type="button"
              className="slide-btn"
              onClick={() => router.push(parentUrl)}
              title={`Back to ${parentTitle} (Esc)`}
            >
              <X className="size-4" />
            </button>
            <div className="slide-nav">
              <button
                type="button"
                className="slide-btn"
                onClick={() => go(-1)}
                disabled={current === 0}
              >
                <ArrowLeft className="size-4" />
              </button>
              <span className="slide-counter">
                {current + 1} / {slides.length}
              </span>
              <button
                type="button"
                className="slide-btn"
                onClick={() => go(1)}
                disabled={current === slides.length - 1}
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
