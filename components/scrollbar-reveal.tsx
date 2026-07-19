"use client";

import { useEffect } from "react";

/** Marks the element that is actually scrolling with [data-scrolling] so
 * only its own overlay thumb fades in (app/global.css) — not every
 * scrollbar on screen. Root scrolls mark <html>. */
export function ScrollbarReveal() {
  useEffect(() => {
    const timers = new WeakMap<Element, number>();
    const onScroll = (event: Event) => {
      const el =
        event.target instanceof Element
          ? event.target
          : document.documentElement;
      el.setAttribute("data-scrolling", "");
      clearTimeout(timers.get(el));
      timers.set(
        el,
        window.setTimeout(() => el.removeAttribute("data-scrolling"), 800),
      );
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      document
        .querySelectorAll("[data-scrolling]")
        .forEach((el) => el.removeAttribute("data-scrolling"));
      document.documentElement.removeAttribute("data-scrolling");
    };
  }, []);
  return null;
}
