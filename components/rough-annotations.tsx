'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { RoughAnnotation } from 'rough-notation/lib/model';
import { annotate } from 'rough-notation';

// Runtime half of the rough-notation port (kufrCleaner annotations-client.ts):
// finds .rough-ann spans emitted by lib/remark-annotations.ts and draws the
// hand-sketched annotation over each. Re-runs on navigation, theme flips
// (colors are CSS vars), and resize (the SVGs are absolutely positioned).

let annotations: RoughAnnotation[] = [];

function cleanup() {
  for (const annotation of annotations) {
    try {
      annotation.remove();
    } catch {
      // element already gone after navigation
    }
  }
  annotations = [];
  // rough-notation appends SVGs to ancestors outside React's tree; sweep strays.
  document.querySelectorAll('svg.rough-annotation').forEach((el) => el.remove());
}

function init(animate: boolean) {
  cleanup();

  // Scope to the article so cached link-preview clones never get annotated.
  const spans = document.querySelectorAll<HTMLElement>('#nd-page .rough-ann');
  if (spans.length === 0) return;

  const style = getComputedStyle(document.documentElement);
  const colorFor = (type: string): string =>
    style.getPropertyValue(`--ann-${type}`).trim() ||
    style.getPropertyValue('--ann-highlight').trim() ||
    'currentColor';

  for (const span of spans) {
    const type = (span.dataset.annType ?? 'highlight') as Parameters<
      typeof annotate
    >[1]['type'];

    const annotation = annotate(span, {
      type,
      color: colorFor(type),
      iterations: 2,
      animate,
      animationDuration: 500,
      multiline: type !== 'circle',
      ...(type === 'bracket' ? { brackets: ['left', 'right'] as const } : {}),
    });
    annotation.show();
    annotations.push(annotation);
  }
}

function debounce(fn: () => void, delay: number): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
}

export function RoughAnnotations() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Let the view-transition crossfade and fonts settle before measuring.
    const timer = window.setTimeout(() => init(!reduceMotion), 250);

    const relayout = debounce(() => init(false), 150);
    window.addEventListener('resize', relayout, { passive: true });

    // Colors are theme tokens — redraw when light/dark flips.
    const observer = new MutationObserver(relayout);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', relayout);
      observer.disconnect();
      cleanup();
    };
  }, [pathname]);

  return null;
}
