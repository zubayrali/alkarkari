"use client";

import {
  useActiveAnchor,
  useTOCItems,
} from "fumadocs-ui/components/toc";
import { ChevronDown, List } from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TocItem = ReturnType<typeof useTOCItems>[number];

function itemId(item: TocItem) {
  return item.url.startsWith("#") ? decodeURIComponent(item.url.slice(1)) : item.url;
}

function titleLength(title: ReactNode) {
  return typeof title === "string" || typeof title === "number"
    ? String(title).length
    : 24;
}

function useOutline() {
  const allItems = useTOCItems();
  const items = useMemo(
    () => allItems.filter(item => item.url.startsWith("#") && item.depth >= 2 && item.depth <= 6),
    [allItems],
  );
  const minDepth = items.length > 0
    ? Math.min(...items.map(item => item.depth))
    : 2;
  const activeAnchor = useActiveAnchor();

  return { items, minDepth, activeAnchor };
}

function scrollItemIntoView(item: HTMLElement, container: HTMLElement) {
  if (container.scrollHeight <= container.clientHeight + 1) return;
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const buffer = 48;
  const before = itemRect.top - containerRect.top - buffer;
  const after = itemRect.bottom - containerRect.bottom + buffer;
  if (before < 0) container.scrollTop += before;
  else if (after > 0) container.scrollTop += after;
}

function updateOverflow(element: HTMLElement | null) {
  if (!element) return;
  const scrollable = element.scrollHeight > element.clientHeight + 1;
  element.dataset.scrollable = String(scrollable);
  element.dataset.atStart = String(scrollable && element.scrollTop <= 1);
  element.dataset.atEnd = String(
    scrollable && element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
  );
}

function navigateToHeading(event: MouseEvent<HTMLAnchorElement>, item: TocItem) {
  if (!item.url.startsWith("#")) return;
  const id = itemId(item);
  const heading = document.getElementById(id);
  if (!heading) return;

  event.preventDefault();
  heading.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  window.history.pushState(null, "", item.url);
  heading.classList.remove("kk-toc-heading-flash");
  void heading.offsetWidth;
  heading.classList.add("kk-toc-heading-flash");
  window.setTimeout(() => heading.classList.remove("kk-toc-heading-flash"), 2600);
}

export function OpenIslamToc() {
  const { items, minDepth, activeAnchor } = useOutline();
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (pinned && !rootRef.current?.contains(event.target as Node)) setPinned(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);

  useEffect(() => {
    const scrollers = [railRef.current, listRef.current];
    const refresh = () => scrollers.forEach(updateOverflow);
    refresh();
    window.addEventListener("resize", refresh, { passive: true });
    return () => window.removeEventListener("resize", refresh);
  }, [items]);

  useEffect(() => {
    if (!activeAnchor) return;
    rootRef.current
      ?.querySelectorAll<HTMLElement>("[data-for]")
      .forEach(element => {
        const active = element.dataset.for === activeAnchor;
        element.dataset.active = String(active);
        if (active) {
          const scroller = element.closest<HTMLElement>("[data-toc-scroll]");
          if (scroller) scrollItemIntoView(element, scroller);
        }
      });
  }, [activeAnchor]);

  if (items.length <= 1) {
    return <div id="nd-toc-placeholder" className="hidden xl:layout:[--fd-toc-width:268px]" />;
  }

  return (
    <aside
      id="nd-toc"
      className="kk-toc-slot max-xl:hidden"
      aria-label="On this page"
    >
      <div
        ref={rootRef}
        className="kk-toc"
        data-pinned={pinned}
        data-density={items.length > 50 ? "dense" : "normal"}
      >
        <button
          ref={railRef}
          type="button"
          className="kk-toc-rail kk-toc-animate"
          aria-label={pinned ? "Close table of contents" : "Pin table of contents open"}
          aria-expanded={pinned}
          data-toc-scroll
          onClick={() => setPinned(value => !value)}
          onScroll={event => updateOverflow(event.currentTarget)}
        >
          {items.map((item, index) => {
            const depth = item.depth - minDepth;
            const width = Math.max(
              0.5,
              Math.min(1.15, (0.5 + Math.min(titleLength(item.title), 55) / 55 * 0.65) * (1 - Math.min(depth, 3) * 0.13)),
            );
            const id = itemId(item);
            return (
              <span
                key={item.url}
                className="kk-toc-tick"
                data-for={id}
                data-active={String(activeAnchor === id)}
                style={{
                  "--kk-toc-order": index + 1,
                  "--kk-toc-tick-width": `${width.toFixed(3)}rem`,
                } as CSSProperties}
              >
                <span />
              </span>
            );
          })}
        </button>

        <nav className="kk-toc-panel" aria-label="Table of contents">
          <p>Contents</p>
          <ol
            ref={listRef}
            className="kk-toc-list"
            data-toc-scroll
            onScroll={event => updateOverflow(event.currentTarget)}
          >
            {items.map(item => {
              const id = itemId(item);
              return (
                <li key={item.url}>
                  <a
                    href={item.url}
                    className="kk-toc-link"
                    data-depth={item.depth - minDepth}
                    data-for={id}
                    data-active={String(activeAnchor === id)}
                    aria-current={activeAnchor === id ? "location" : undefined}
                    onClick={event => navigateToHeading(event, item)}
                  >
                    {item.title}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </aside>
  );
}

export function OpenIslamMobileToc() {
  const { items, minDepth, activeAnchor } = useOutline();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeItem = items.find(item => itemId(item) === activeAnchor) ?? items[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (items.length <= 1) return null;

  return (
    <div
      ref={rootRef}
      className="kk-mobile-toc xl:hidden max-xl:layout:[--fd-toc-popover-height:--spacing(10)]"
      data-open={open}
    >
      <button
        type="button"
        className="kk-mobile-toc-bar"
        aria-expanded={open}
        aria-controls="kk-mobile-toc-panel"
        onClick={() => setOpen(value => !value)}
      >
        <List aria-hidden="true" />
        <span>{activeItem?.title ?? "Contents"}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      <nav id="kk-mobile-toc-panel" className="kk-mobile-toc-panel" aria-label="Table of contents">
        <p>Contents</p>
        <ol>
          {items.map(item => {
            const id = itemId(item);
            return (
              <li key={item.url}>
                <a
                  href={item.url}
                  data-depth={item.depth - minDepth}
                  data-active={String(activeAnchor === id)}
                  aria-current={activeAnchor === id ? "location" : undefined}
                  onClick={event => {
                    navigateToHeading(event, item);
                    setOpen(false);
                  }}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
      <button
        type="button"
        className="kk-mobile-toc-backdrop"
        aria-label="Close table of contents"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
