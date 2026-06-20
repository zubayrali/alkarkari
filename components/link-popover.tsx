'use client';

import type { Placement } from '@floating-ui/dom';
import {
  arrow as floatingArrow,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Hover previews for internal links, ported from aarnphm/quartz
// popover.inline.ts. One delegated listener pair on the document previews any
// same-origin link inside the article; fetched pages are parsed off-DOM and
// cached as popover elements on <body> for the rest of the session.

let activeAnchor: HTMLAnchorElement | null = null;
let activeRequest: { abort: () => void; link: HTMLAnchorElement } | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const htmlCache = new Map<string, string>();

function createPopoverElement(): {
  popoverElement: HTMLElement;
  popoverInner: HTMLDivElement;
} {
  const popoverElement = document.createElement('div');
  popoverElement.classList.add('link-popover');
  popoverElement.setAttribute('aria-hidden', 'true');
  const popoverArrow = document.createElement('div');
  popoverArrow.classList.add('link-popover-arrow');
  const popoverInner = document.createElement('div');
  popoverInner.classList.add('link-popover-inner');
  popoverElement.append(popoverArrow, popoverInner);
  return { popoverElement, popoverInner };
}

/** Strip chrome that makes no sense inside a preview. */
function cleanPreviewElement(element: HTMLElement): HTMLElement {
  const removable = element.querySelectorAll<HTMLElement>(
    'section[data-footnotes], [data-backlinks], [data-skip-preview], script, style, button, .sidenote-content',
  );
  removable.forEach((node) => node.remove());
  return element;
}

/** Rewrite relative href/src so preview content resolves against its own page. */
function normalizeRelativeUrls(root: ParentNode, baseUrl: URL) {
  const rewrite = (el: Element, attr: string) => {
    const value = el.getAttribute(attr);
    if (!value || value.startsWith('#')) return;
    try {
      const resolved = new URL(value, baseUrl);
      if (resolved.origin === window.location.origin) {
        el.setAttribute(attr, resolved.pathname + resolved.search + resolved.hash);
      }
    } catch {
      // leave malformed URLs untouched
    }
  };
  root.querySelectorAll('a[href]').forEach((el) => rewrite(el, 'href'));
  root.querySelectorAll('img[src]').forEach((el) => rewrite(el, 'src'));
}

function findHashTarget(container: ParentNode, hash: string): HTMLElement | null {
  const rawId = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!rawId) return null;
  const id = rawId.startsWith('popover-') ? rawId : `popover-${rawId}`;
  return container.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
}

function scrollPopoverToHash(popoverInner: HTMLElement, hash: string) {
  if (!hash) return;
  const heading = findHashTarget(popoverInner, hash);
  if (!heading) return;
  const top =
    heading.getBoundingClientRect().top -
    popoverInner.getBoundingClientRect().top +
    popoverInner.scrollTop -
    12;
  popoverInner.scroll({ top, behavior: 'instant' });
}

function placementSide(placement: Placement): 'top' | 'right' | 'bottom' | 'left' {
  if (placement.startsWith('top')) return 'top';
  if (placement.startsWith('right')) return 'right';
  if (placement.startsWith('bottom')) return 'bottom';
  return 'left';
}

function positionPopoverArrow(
  arrowElement: HTMLElement,
  placement: Placement,
  x: number | undefined,
  y: number | undefined,
) {
  arrowElement.style.left = '';
  arrowElement.style.right = '';
  arrowElement.style.top = '';
  arrowElement.style.bottom = '';

  if (x !== undefined) arrowElement.style.left = `${Math.round(x)}px`;
  if (y !== undefined) arrowElement.style.top = `${Math.round(y)}px`;

  const inset = 'var(--popover-arrow-inset)';
  switch (placementSide(placement)) {
    case 'top':
      arrowElement.style.bottom = inset;
      break;
    case 'right':
      arrowElement.style.left = inset;
      break;
    case 'bottom':
      arrowElement.style.top = inset;
      break;
    case 'left':
      arrowElement.style.right = inset;
      break;
  }
}

async function setPosition(link: HTMLElement, popoverElement: HTMLElement) {
  const arrowElement = popoverElement.querySelector<HTMLElement>('.link-popover-arrow');
  const middleware = [
    offset(4),
    shift({ padding: 8 }),
    flip(),
    ...(arrowElement ? [floatingArrow({ element: arrowElement, padding: 12 })] : []),
  ];

  const {
    x,
    y,
    placement: finalPlacement,
    middlewareData,
  } = await computePosition(link, popoverElement, {
    placement: 'bottom',
    strategy: 'fixed',
    middleware,
  });

  popoverElement.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  popoverElement.dataset.placement = finalPlacement;
  if (arrowElement) {
    positionPopoverArrow(
      arrowElement,
      finalPlacement,
      middlewareData.arrow?.x,
      middlewareData.arrow?.y,
    );
  }
}

function cancelDismiss() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

/** Hide popovers (optionally keeping one) WITHOUT touching the active anchor. */
function deactivatePopovers(except?: HTMLElement) {
  cancelDismiss();
  document.querySelectorAll<HTMLElement>('.link-popover').forEach((popoverElement) => {
    if (popoverElement === except) return;
    popoverElement.classList.remove('active-popover');
  });
}

function clearActivePopover() {
  activeAnchor = null;
  deactivatePopovers();
}

function scheduleDismiss() {
  cancelDismiss();
  dismissTimer = setTimeout(() => {
    dismissTimer = null;
    clearActivePopover();
  }, 300);
}

async function showPopover(
  link: HTMLAnchorElement,
  popoverElement: HTMLElement,
  hash = '',
) {
  deactivatePopovers(popoverElement);
  popoverElement.classList.add('active-popover');
  await setPosition(link, popoverElement);

  if (hash !== '') {
    const popoverInner =
      popoverElement.querySelector<HTMLElement>('.link-popover-inner');
    if (popoverInner) scrollPopoverToHash(popoverInner, hash);
  }
}

function popoverIdFor(pathname: string): string {
  return `link-popover:${pathname}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function populatePagePreview(
  targetUrl: URL,
  popoverInner: HTMLDivElement,
  signal: AbortSignal,
): Promise<boolean> {
  const cached = htmlCache.get(targetUrl.pathname);
  if (cached) {
    popoverInner.innerHTML = cached;
    return true;
  }

  const response = await fetch(targetUrl.toString(), {
    headers: { Accept: 'text/html' },
    signal,
  }).catch((error) => {
    if (!isAbortError(error)) console.error(error);
    return null;
  });
  if (!response || !response.ok) return false;

  const contents = await response.text().catch(() => null);
  if (contents === null) return false;

  const html = new DOMParser().parseFromString(contents, 'text/html');
  normalizeRelativeUrls(html, targetUrl);
  html.querySelectorAll('[id]').forEach((el) => {
    el.id = `popover-${el.id}`;
  });

  const article = html.querySelector<HTMLElement>(
    '[data-popover-hint], article#nd-page, article, main',
  );
  if (!article) return false;

  // Base pages are data tables — previewing them is ugly and wasteful.
  if (article.querySelector('.base-table-wrapper, .base-card-grid, .base-card-container, .base-list-container')) {
    return false;
  }

  popoverInner.replaceChildren(cleanPreviewElement(article));
  htmlCache.set(targetUrl.pathname, popoverInner.innerHTML);
  return true;
}

async function handleInternalLink(link: HTMLAnchorElement) {
  const targetUrl = new URL(link.href);
  const hash = decodeURIComponent(targetUrl.hash);
  targetUrl.hash = '';
  targetUrl.search = '';

  const popoverId = popoverIdFor(targetUrl.pathname);
  const existing = document.getElementById(popoverId);
  if (existing) {
    await showPopover(link, existing, hash);
    return;
  }

  if (activeRequest && activeRequest.link !== link) {
    activeRequest.abort();
    activeRequest = null;
  }

  const controller = new AbortController();
  activeRequest = { abort: () => controller.abort(), link };

  const { popoverElement, popoverInner } = createPopoverElement();
  popoverElement.id = popoverId;

  const populated = await populatePagePreview(targetUrl, popoverInner, controller.signal);
  if (activeRequest?.link === link) activeRequest = null;
  if (!populated || activeAnchor !== link) return;
  // A parallel hover may have inserted the same popover already.
  if (document.getElementById(popoverId)) return;

  document.body.appendChild(popoverElement);

  popoverElement.addEventListener('mouseenter', () => {
    cancelDismiss();
  });

  popoverElement.addEventListener('mouseleave', (event) => {
    const related = event.relatedTarget;
    if (related instanceof Node && activeAnchor && activeAnchor.contains(related)) return;
    scheduleDismiss();
  });

  await showPopover(link, popoverElement, hash);
}

function previewableLink(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest('a');
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (!link.closest('article')) return null;
  if (link.closest('.link-popover')) return null;
  if (link.classList.contains('base-card-image')) return null;
  if (link.dataset.noPopover === '' || link.dataset.noPopover === 'true') return null;
  if (link.origin !== window.location.origin) return null;
  if (link.hasAttribute('download')) return null;
  // Same-page links (TOC, heading anchors) preview nothing new.
  if (link.pathname === window.location.pathname) return null;
  // Only document URLs — assets like images/PDFs have file extensions.
  const leaf = link.pathname.split('/').pop() ?? '';
  if (leaf.includes('.')) return null;
  return link;
}

function onMouseOver(event: MouseEvent) {
  const link = previewableLink(event.target);
  if (!link) return;
  // Re-entering the active link (or entering it for the first time) cancels
  // any pending dismiss so the popover stays alive.
  cancelDismiss();
  if (link === activeAnchor) return;
  activeAnchor = link;
  void handleInternalLink(link);
}

function onMouseOut(event: MouseEvent) {
  const link = previewableLink(event.target);
  if (!link || link !== activeAnchor) return;

  const related = event.relatedTarget;
  if (related instanceof Node) {
    if (link.contains(related)) return;
    if (related instanceof Element && related.closest('.link-popover')) return;
  }

  if (activeRequest?.link === link) {
    activeRequest.abort();
    activeRequest = null;
  }
  // Grace period: cursor may be crossing the gap toward the popover.
  scheduleDismiss();
}

export function LinkPopover() {
  const pathname = usePathname();

  useEffect(() => {
    // Hover previews only make sense with a hovering pointer.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Backup dismissals for the rare case the hover-out is missed (fast flicks,
    // pointer leaving via a gap, mouseout that never fires after a layout shift):
    // any click, Escape, or page scroll force-closes the preview.
    const onClick = () => clearActivePopover();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearActivePopover();
    };
    const onScrollCapture = (event: Event) => {
      // Scrolling the popover's own content must not close it.
      if (event.target instanceof Element && event.target.closest('.link-popover')) {
        return;
      }
      clearActivePopover();
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('scroll', onScrollCapture, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScrollCapture, { capture: true });
      if (activeRequest) {
        activeRequest.abort();
        activeRequest = null;
      }
      clearActivePopover();
    };
  }, []);

  useEffect(() => {
    // Close any open preview when navigation commits.
    clearActivePopover();
  }, [pathname]);

  return null;
}
