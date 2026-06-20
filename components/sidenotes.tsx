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

  const sidebar = document.querySelector<HTMLElement>('#nd-sidebar');
  const sidebarVisible =
    sidebar &&
    sidebar.getBoundingClientRect().width > 0 &&
    getComputedStyle(sidebar).display !== 'none';
  const leftBoundary = sidebarVisible ? sidebar.getBoundingClientRect().right : 0;

  const toc = document.querySelector<HTMLElement>('#nd-toc');
  const tocVisible =
    toc &&
    toc.getBoundingClientRect().width > 0 &&
    getComputedStyle(toc).display !== 'none';
  const rightBoundary = tocVisible ? toc.getBoundingClientRect().left : window.innerWidth;

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

      content.style.cssText = '';
      content.style.display = 'none';
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
    const mainRect = mainColumn.getBoundingClientRect();

    const allowLeft = this.margins.left && span.getAttribute('data-allow-left') !== 'false';
    const allowRight = this.margins.right && span.getAttribute('data-allow-right') !== 'false';
    const gap = remToPx(GAP);

    // Allow nudging down to clear the previous note on that side.
    // With both margins the notes alternate, so drift is moderate.
    // With one margin all notes stack, so allow more drift.
    const bothSides = allowLeft && allowRight;
    const maxDrift = remToPx(bothSides ? 8 : 14);

    const rightStart = Math.max(topPosition, this.lastBottomRight + gap);
    const leftStart = Math.max(topPosition, this.lastBottomLeft + gap);
    const canRight = allowRight && rightStart - topPosition <= maxDrift;
    const canLeft = allowLeft && leftStart - topPosition <= maxDrift;

    let side: 'left' | 'right';
    let effectiveTop: number;
    if (canRight && (!canLeft || rightStart <= leftStart)) {
      side = 'right';
      effectiveTop = rightStart;
    } else if (canLeft) {
      side = 'left';
      effectiveTop = leftStart;
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

    // Position vertically relative to the offset parent.
    const parentTop = (content.offsetParent as HTMLElement | null)?.getBoundingClientRect().top ?? 0;
    content.style.top = `${effectiveTop - (parentTop + scrollTop)}px`;
    content.style.marginTop = '0';

    const bottomPosition = effectiveTop + contentHeight;
    if (side === 'left') this.lastBottomLeft = bottomPosition;
    else this.lastBottomRight = bottomPosition;

    state.side = side;

    // JS-based hover highlighting — the CSS `~` sibling combinator can't
    // reach the content reliably once we use explicit `top` positioning.
    state.controller = new AbortController();
    const { signal } = state.controller;
    const highlight = (on: boolean) => content.classList.toggle('sidenote-highlight', on);
    span.addEventListener('mouseenter', () => highlight(true), { signal });
    span.addEventListener('mouseleave', () => highlight(false), { signal });
    content.addEventListener('mouseenter', () => { highlight(true); this.setActiveState(state, true); }, { signal });
    content.addEventListener('mouseleave', () => { highlight(false); this.setActiveState(state, false); }, { signal });

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
    const mainColumn = first ? getMainColumn(first.content) : null;
    this.margins = getMarginSpace(mainColumn);
    this.closePopover();
    this.reset();

    // Clear any previous overflow padding.
    if (mainColumn) mainColumn.style.paddingBottom = '';

    // Track which footnote markers (e.g. "1") are already placed so
    // duplicate references (same [^1] used twice) don't appear twice.
    const placedMarkers = new Map<string, SidenoteState>();

    this.sidenotes.forEach((state) => {
      const forceInline = state.span.getAttribute('data-force-inline') === 'true';
      const sideAvailable = this.margins.left || this.margins.right;
      const marker = state.label.querySelector('.sidenote-number')?.textContent ?? '';

      // Duplicate reference — hide this content but wire the label's hover
      // to highlight the already-placed sidenote's content.
      const original = marker ? placedMarkers.get(marker) : undefined;
      if (original) {
        state.content.style.display = 'none';
        state.content.setAttribute('aria-hidden', 'true');
        state.controller = new AbortController();
        const { signal } = state.controller;
        const highlight = (on: boolean) => original.content.classList.toggle('sidenote-highlight', on);
        state.span.addEventListener('mouseenter', () => highlight(true), { signal });
        state.span.addEventListener('mouseleave', () => highlight(false), { signal });
        return;
      }

      if (!sideAvailable || forceInline || !this.positionSideToSide(state)) {
        this.positionPopover(state);
      }

      if (marker) placedMarkers.set(marker, state);
    });

    // If margin sidenotes extend below the article, add padding so the
    // prev/next footer doesn't overlap them.
    if (mainColumn) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const articleBottom = mainColumn.getBoundingClientRect().bottom + scrollTop;
      const lowestSidenote = Math.max(this.lastBottomLeft, this.lastBottomRight);
      if (lowestSidenote > articleBottom) {
        const overflow = lowestSidenote - articleBottom + remToPx(2);
        mainColumn.style.paddingBottom = `${overflow}px`;
      }
    }
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

    // Re-layout when reader mode toggles or sidebar collapses — the margin
    // geometry changes but no resize event fires. Use a longer debounce so
    // CSS transitions (sidebar slide, content reflow) settle before measuring.
    const debouncedRelayout = debounce(() => manager.layout(), 250);

    const htmlObserver = new MutationObserver(debouncedRelayout);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-reader-mode'],
    });

    const sidebar = document.getElementById('nd-sidebar');
    const sidebarObserver = sidebar ? new MutationObserver(debouncedRelayout) : null;
    sidebarObserver?.observe(sidebar!, {
      attributes: true,
      attributeFilter: ['data-collapsed'],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', debouncedLayout);
      htmlObserver.disconnect();
      sidebarObserver?.disconnect();
      manager.destroy();
    };
  }, [pathname]);

  return null;
}
