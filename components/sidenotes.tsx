'use client';

import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Sidenote layout engine, ported from aarnphm/quartz sidenotes.inline.ts.
// Decides per viewport whether footnote sidenotes sit in the left/right
// margins (stacked to avoid collisions) or fall back to a click-to-open
// floating popover, and re-lays them out on resize. Geometry is adapted from
// Quartz's centered `.main-col` to the Fumadocs docs layout: free margin
// space is measured against the sidebar (#nd-sidebar) and the TOC (#nd-toc).

const SIDENOTE_WIDTH = 14; // rem — keep in sync with --sidenote-width in sidenotes.css
const SIDENOTE_GUTTER = 1; // rem
const GAP = 1; // rem
const MIN_DESKTOP_WIDTH = 1280; // px

const LABEL_ATTRS = ['role', 'tabindex', 'aria-expanded', 'aria-haspopup', 'data-inline'] as const;
const CONTENT_CLASSES = ['sidenote-left', 'sidenote-right', 'sidenote-popover'] as const;

function remToPx(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function cssPixelValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOffsetParentRect(content: HTMLElement): Pick<DOMRect, 'left' | 'right'> {
  const offsetParent = content.offsetParent;
  if (!offsetParent) return { left: 0, right: window.innerWidth };

  const rect = offsetParent.getBoundingClientRect();
  const style = getComputedStyle(offsetParent);

  return {
    left: rect.left + cssPixelValue(style.borderLeftWidth),
    right: rect.right - cssPixelValue(style.borderRightWidth),
  };
}

function getMainColumn(content?: Element): HTMLElement | null {
  return (
    content?.closest<HTMLElement>('.prose') ??
    document.querySelector<HTMLElement>('#nd-page .prose, article#nd-page, article')
  );
}

interface MarginSpace {
  left: boolean;
  right: boolean;
}

/** Which margins have room for a sidenote column, measured against the real layout. */
function getMarginSpace(mainColumn: HTMLElement | null): MarginSpace {
  if (!mainColumn || window.innerWidth < MIN_DESKTOP_WIDTH) {
    return { left: false, right: false };
  }

  const needed = remToPx(SIDENOTE_WIDTH + SIDENOTE_GUTTER);
  const mainRect = mainColumn.getBoundingClientRect();

  const sidebar = document.querySelector('#nd-sidebar');
  const sidebarRect = sidebar?.getBoundingClientRect();
  const leftBoundary = sidebarRect && sidebarRect.width > 0 ? sidebarRect.right : 0;

  const toc = document.querySelector('#nd-toc');
  const tocRect = toc?.getBoundingClientRect();
  const rightBoundary =
    tocRect && tocRect.width > 0 ? tocRect.left : window.innerWidth;

  return {
    left: mainRect.left - leftBoundary >= needed,
    right: rightBoundary - mainRect.right >= needed,
  };
}

interface SidenoteState {
  span: HTMLElement;
  label: HTMLElement;
  content: HTMLElement;
  side?: 'left' | 'right';
  controller?: AbortController;
}

class SidenoteManager {
  private sidenotes: SidenoteState[] = [];
  private lastBottomLeft = 0;
  private lastBottomRight = 0;
  private margins: MarginSpace = { left: false, right: false };

  constructor() {
    this.initialize();
  }

  get isEmpty(): boolean {
    return this.sidenotes.length === 0;
  }

  private cleanupHandlers(state: SidenoteState) {
    state.controller?.abort();
    state.controller = undefined;
  }

  private setActiveState(state: SidenoteState, active: boolean) {
    state.span.classList.toggle('active', active);
    state.label.classList.toggle('active', active);
  }

  private openPopover: SidenoteState | null = null;
  private dismiss: AbortController | null = null;

  private closePopover() {
    const state = this.openPopover;
    this.openPopover = null;
    this.dismiss?.abort();
    this.dismiss = null;
    if (!state) return;
    state.label.setAttribute('aria-expanded', 'false');
    state.content.style.display = 'none';
    state.content.setAttribute('aria-hidden', 'true');
    this.setActiveState(state, false);
  }

  private async showPopover(state: SidenoteState) {
    this.closePopover();
    this.openPopover = state;

    const { label, content } = state;
    label.setAttribute('aria-expanded', 'true');
    content.style.display = 'block';
    content.setAttribute('aria-hidden', 'false');
    this.setActiveState(state, true);

    const { x, y } = await computePosition(label, content, {
      placement: 'bottom',
      strategy: 'fixed',
      middleware: [offset(6), shift({ padding: 8 }), flip()],
    });
    content.style.left = `${Math.round(x)}px`;
    content.style.top = `${Math.round(y)}px`;

    // Dismiss on outside interaction, Escape, or scroll.
    this.dismiss = new AbortController();
    const { signal } = this.dismiss;
    document.addEventListener(
      'pointerdown',
      (event) => {
        const target = event.target;
        if (target instanceof Node && (content.contains(target) || label.contains(target))) {
          return;
        }
        this.closePopover();
      },
      { signal },
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') this.closePopover();
      },
      { signal },
    );
    window.addEventListener('scroll', () => this.closePopover(), {
      signal,
      passive: true,
      once: true,
    });
  }

  private measureContentHeight(content: HTMLElement): number {
    const probe = content.cloneNode(true) as HTMLElement;
    probe.removeAttribute('id');
    probe.style.cssText = 'display:block;visibility:hidden;position:absolute;left:0;top:0';
    content.parentElement?.appendChild(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  }

  private initialize() {
    const sidenoteSpans = document.querySelectorAll<HTMLSpanElement>('.sidenote');

    sidenoteSpans.forEach((span) => {
      const label = span.querySelector<HTMLSpanElement>('.sidenote-label');
      if (!label) return;

      const content = span.nextElementSibling as HTMLElement | null;
      if (!content || !content.classList.contains('sidenote-content')) return;

      content.style.display = 'none';
      content.setAttribute('aria-hidden', 'true');

      this.sidenotes.push({ span, label, content });
    });
  }

  private reset() {
    this.lastBottomLeft = 0;
    this.lastBottomRight = 0;

    this.sidenotes.forEach((state) => {
      const { label, content } = state;

      this.cleanupHandlers(state);

      LABEL_ATTRS.forEach((attr) => label.removeAttribute(attr));
      label.style.cursor = '';
      label.style.userSelect = '';

      this.setActiveState(state, false);

      content.style.cssText = 'display:none';
      content.classList.remove(...CONTENT_CLASSES);
      content.setAttribute('aria-hidden', 'true');
    });
  }

  private positionSideToSide(state: SidenoteState): boolean {
    const { span, label, content } = state;
    const labelRect = label.getBoundingClientRect();
    const contentHeight = this.measureContentHeight(content);
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const topPosition = labelRect.top + scrollTop;

    const mainColumn = getMainColumn(content);
    if (!mainColumn) return false;

    // Never overflow past the bottom of the article body.
    const mainRect = mainColumn.getBoundingClientRect();
    if (topPosition + contentHeight > mainRect.bottom + scrollTop) return false;

    const allowLeft = this.margins.left && span.getAttribute('data-allow-left') !== 'false';
    const allowRight = this.margins.right && span.getAttribute('data-allow-right') !== 'false';
    const gap = remToPx(GAP);
    const leftSpace = topPosition - this.lastBottomLeft;
    const rightSpace = topPosition - this.lastBottomRight;

    let side: 'left' | 'right';
    if (allowRight && rightSpace >= contentHeight + gap) {
      side = 'right';
    } else if (allowLeft && leftSpace >= contentHeight + gap) {
      side = 'left';
    } else {
      return false;
    }

    content.classList.add(`sidenote-${side}`);
    content.style.display = 'block';
    content.setAttribute('aria-hidden', 'false');

    const gutter = remToPx(SIDENOTE_GUTTER);
    const sidenoteWidth = remToPx(SIDENOTE_WIDTH);
    const parentRect = getOffsetParentRect(content);
    const sideOffset =
      side === 'left'
        ? mainRect.left - parentRect.left - sidenoteWidth - gutter
        : parentRect.right - mainRect.right - sidenoteWidth - gutter;

    content.style.left = '';
    content.style.right = '';
    content.style[side] = `${sideOffset}px`;

    const bottomPosition = topPosition + contentHeight;
    if (side === 'left') this.lastBottomLeft = bottomPosition;
    else this.lastBottomRight = bottomPosition;

    state.side = side;
    return true;
  }

  /** No margin room: the label opens the note as a floating popover instead. */
  private positionPopover(state: SidenoteState) {
    const { label, content } = state;

    this.cleanupHandlers(state);

    content.classList.add('sidenote-popover');
    content.style.display = 'none';
    content.setAttribute('aria-hidden', 'true');

    label.style.cursor = 'pointer';
    label.style.userSelect = 'none';
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
    label.setAttribute('aria-haspopup', 'dialog');
    label.setAttribute('aria-expanded', 'false');
    label.setAttribute('data-inline', '');

    const toggle = () => {
      if (this.openPopover === state) this.closePopover();
      else void this.showPopover(state);
    };

    state.controller = new AbortController();
    const { signal } = state.controller;

    label.addEventListener(
      'click',
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      },
      { capture: true, signal },
    );

    label.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      },
      { signal },
    );
  }

  public layout() {
    const first = this.sidenotes[0];
    this.margins = getMarginSpace(first ? getMainColumn(first.content) : null);
    this.closePopover();
    this.reset();

    this.sidenotes.forEach((state) => {
      const forceInline = state.span.getAttribute('data-force-inline') === 'true';
      const sideAvailable = this.margins.left || this.margins.right;

      if (!sideAvailable || forceInline || !this.positionSideToSide(state)) {
        this.positionPopover(state);
      }
    });
  }

  public destroy() {
    this.closePopover();
    this.sidenotes.forEach((state) => this.cleanupHandlers(state));
    this.sidenotes = [];
  }
}

function debounce(fn: () => void, delay: number): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
}

export function Sidenotes() {
  const pathname = usePathname();

  useEffect(() => {
    const manager = new SidenoteManager();
    if (manager.isEmpty) return;

    // Initial layout after paint so fonts/images have settled enough to measure.
    const raf = requestAnimationFrame(() => manager.layout());

    const debouncedLayout = debounce(() => manager.layout(), 100);
    window.addEventListener('resize', debouncedLayout, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', debouncedLayout);
      manager.destroy();
    };
  }, [pathname]);

  return null;
}
