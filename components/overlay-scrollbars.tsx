"use client";

import { useEffect } from "react";

const CANDIDATE_SELECTOR = [
  "[data-overlay-scrollbar]",
  "[data-toc-scroll]",
  "[data-radix-scroll-area-viewport]",
  ".overflow-auto",
  ".overflow-x-auto",
  ".overflow-y-auto",
  "#nd-sidebar",
  ".kk-mobile-toc-panel",
  ".table-wrapper",
  ".table-scroll",
  ".prose pre",
].join(",");

const MIN_THUMB_LENGTH = 32;
const TRACK_INSET = 2;
const HIDE_DELAY = 850;

type Axis = "x" | "y";

type ThumbState = {
  axis: Axis;
  element: HTMLDivElement;
  visibleUntil: number;
};

type TargetState = {
  target: HTMLElement;
  thumbs: Record<Axis, ThumbState>;
  assignedId?: string;
  cleanup: () => void;
};

/**
 * Zero-gutter overlay scrollbars, adapted from OpenIslam's implementation.
 * Native scrolling remains the source of truth; this component only mirrors
 * its position into a transient, draggable thumb.
 */
export function OverlayScrollbars() {
  useEffect(() => {
    const targets = new Map<HTMLElement, TargetState>();
    const layer = document.createElement("div");
    const forcedColors = window.matchMedia("(forced-colors: active)");
    let frame = 0;
    let generatedId = 0;

    layer.className = "kk-overlay-scrollbars";
    document.body.append(layer);

    const isRoot = (target: HTMLElement) =>
      target === document.documentElement || target === document.body;

    const metrics = (target: HTMLElement, axis: Axis) => {
      if (isRoot(target)) {
        const scrollingElement = document.scrollingElement ?? document.documentElement;
        return axis === "y"
          ? { client: innerHeight, scroll: scrollingElement.scrollHeight, position: scrollY }
          : { client: innerWidth, scroll: scrollingElement.scrollWidth, position: scrollX };
      }
      return axis === "y"
        ? { client: target.clientHeight, scroll: target.scrollHeight, position: target.scrollTop }
        : {
            client: target.clientWidth,
            scroll: target.scrollWidth,
            position: Math.abs(target.scrollLeft),
          };
    };

    const targetRect = (target: HTMLElement) => {
      if (isRoot(target)) return new DOMRect(0, 0, innerWidth, innerHeight);
      const rect = target.getBoundingClientRect();
      return new DOMRect(
        Math.max(0, rect.left),
        Math.max(0, rect.top),
        Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left)),
        Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)),
      );
    };

    const allowsAxis = (target: HTMLElement, axis: Axis) => {
      if (isRoot(target)) return true;
      const style = getComputedStyle(target);
      const overflow = axis === "y" ? style.overflowY : style.overflowX;
      return overflow === "auto" || overflow === "scroll" || overflow === "overlay";
    };

    const setPosition = (target: HTMLElement, axis: Axis, value: number) => {
      if (isRoot(target)) {
        window.scrollTo({
          left: axis === "x" ? value : scrollX,
          top: axis === "y" ? value : scrollY,
          behavior: "auto",
        });
      } else if (axis === "y") {
        target.scrollTop = value;
      } else {
        target.scrollLeft = getComputedStyle(target).direction === "rtl" ? -value : value;
      }
    };

    const updateThumb = (state: TargetState, thumb: ThumbState, now: number) => {
      const { target } = state;
      const { axis, element } = thumb;
      const rect = targetRect(target);
      const values = metrics(target, axis);
      const overflow =
        !forcedColors.matches &&
        allowsAxis(target, axis) &&
        values.scroll - values.client > 1;
      const track = Math.max(0, (axis === "y" ? rect.height : rect.width) - TRACK_INSET * 2);

      if (!overflow || track <= 0 || rect.width <= 0 || rect.height <= 0) {
        element.hidden = true;
        element.tabIndex = -1;
        element.setAttribute("aria-hidden", "true");
        return;
      }

      const length = Math.min(
        track,
        Math.max(MIN_THUMB_LENGTH, track * (values.client / values.scroll)),
      );
      const progress = values.position / Math.max(1, values.scroll - values.client);
      const offset = Math.max(0, Math.min(track - length, progress * (track - length)));
      const rtl = getComputedStyle(target).direction === "rtl";

      element.hidden = false;
      if (axis === "y") {
        element.style.top = `${rect.top + TRACK_INSET + offset}px`;
        element.style.left = rtl
          ? `${rect.left + TRACK_INSET}px`
          : `${rect.right - TRACK_INSET - 12}px`;
        element.style.width = "12px";
        element.style.height = `${length}px`;
      } else {
        element.style.top = `${rect.bottom - TRACK_INSET - 12}px`;
        element.style.left = `${rect.left + TRACK_INSET + offset}px`;
        element.style.width = `${length}px`;
        element.style.height = "12px";
      }

      const visible = thumb.visibleUntil > now || element.matches(":hover, :focus-visible");
      element.classList.toggle("is-visible", visible);
      element.tabIndex = visible ? 0 : -1;
      element.setAttribute("aria-hidden", String(!visible));
      element.setAttribute("aria-valuemin", "0");
      element.setAttribute("aria-valuemax", String(Math.round(values.scroll - values.client)));
      element.setAttribute("aria-valuenow", String(Math.round(values.position)));
    };

    const updateAll = () => {
      frame = 0;
      const now = performance.now();
      for (const [target, state] of targets) {
        if (!target.isConnected) {
          state.cleanup();
          targets.delete(target);
          continue;
        }
        updateThumb(state, state.thumbs.x, now);
        updateThumb(state, state.thumbs.y, now);
      }
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateAll);
    };

    const reveal = (state: TargetState, duration = HIDE_DELAY) => {
      const until = duration === Number.POSITIVE_INFINITY
        ? duration
        : performance.now() + duration;
      state.thumbs.x.visibleUntil = until;
      state.thumbs.y.visibleUntil = until;
      scheduleUpdate();
      if (Number.isFinite(duration)) window.setTimeout(scheduleUpdate, duration + 30);
    };

    const createThumb = (
      target: HTMLElement,
      axis: Axis,
      controlsId: string,
    ): ThumbState => {
      const element = document.createElement("div");
      element.className = `kk-overlay-scrollbar kk-overlay-scrollbar--${axis}`;
      element.setAttribute("role", "scrollbar");
      element.setAttribute("aria-controls", controlsId);
      element.setAttribute("aria-orientation", axis === "y" ? "vertical" : "horizontal");
      element.setAttribute("aria-label", axis === "y" ? "Vertical scrollbar" : "Horizontal scrollbar");
      element.setAttribute("aria-hidden", "true");
      element.tabIndex = -1;
      layer.append(element);

      const thumb: ThumbState = { axis, element, visibleUntil: 0 };
      let dragStartPointer = 0;
      let dragStartScroll = 0;

      element.addEventListener("pointerdown", event => {
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        element.classList.add("is-dragging");
        dragStartPointer = axis === "y" ? event.clientY : event.clientX;
        dragStartScroll = metrics(target, axis).position;
        thumb.visibleUntil = Number.POSITIVE_INFINITY;
      });
      element.addEventListener("pointermove", event => {
        if (!element.hasPointerCapture(event.pointerId)) return;
        const rect = targetRect(target);
        const values = metrics(target, axis);
        const track = Math.max(1, (axis === "y" ? rect.height : rect.width) - TRACK_INSET * 2);
        const length = Math.max(MIN_THUMB_LENGTH, track * (values.client / values.scroll));
        const travel = Math.max(1, track - length);
        const pointer = axis === "y" ? event.clientY : event.clientX;
        setPosition(
          target,
          axis,
          dragStartScroll + ((pointer - dragStartPointer) / travel) * (values.scroll - values.client),
        );
        scheduleUpdate();
      });
      const finishDrag = (event: PointerEvent) => {
        if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
        element.classList.remove("is-dragging");
        thumb.visibleUntil = performance.now() + HIDE_DELAY;
        window.setTimeout(scheduleUpdate, HIDE_DELAY + 30);
      };
      element.addEventListener("pointerup", finishDrag);
      element.addEventListener("pointercancel", finishDrag);
      element.addEventListener("keydown", event => {
        const values = metrics(target, axis);
        const page = Math.max(40, values.client * .9);
        const deltas: Record<string, number> = {
          ArrowDown: 40,
          ArrowRight: 40,
          ArrowUp: -40,
          ArrowLeft: -40,
          PageDown: page,
          PageUp: -page,
          Home: -values.scroll,
          End: values.scroll,
        };
        const delta = deltas[event.key];
        if (delta === undefined) return;
        if (axis === "y" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
        if (axis === "x" && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
        event.preventDefault();
        setPosition(target, axis, values.position + delta);
        scheduleUpdate();
      });
      return thumb;
    };

    const addTarget = (target: HTMLElement) => {
      if (targets.has(target) || target.closest(".kk-overlay-scrollbars")) return;
      let assignedId: string | undefined;
      if (!target.id) {
        assignedId = `kk-overlay-scroll-region-${++generatedId}`;
        target.id = assignedId;
      }
      target.classList.add("kk-overlay-scroll-target");
      const controlsId = target.id;
      const thumbs = {
        x: createThumb(target, "x", controlsId),
        y: createThumb(target, "y", controlsId),
      };
      const state: TargetState = { target, thumbs, assignedId, cleanup: () => {} };
      const onScroll = () => reveal(state);
      const onEnter = () => reveal(state, Number.POSITIVE_INFINITY);
      const onLeave = () => reveal(state);
      target.addEventListener("scroll", onScroll, { passive: true });
      if (!isRoot(target)) {
        target.addEventListener("pointerenter", onEnter, { passive: true });
        target.addEventListener("pointerleave", onLeave, { passive: true });
      }
      state.cleanup = () => {
        target.removeEventListener("scroll", onScroll);
        target.removeEventListener("pointerenter", onEnter);
        target.removeEventListener("pointerleave", onLeave);
        target.classList.remove("kk-overlay-scroll-target");
        thumbs.x.element.remove();
        thumbs.y.element.remove();
        if (assignedId && target.id === assignedId) target.removeAttribute("id");
        resizeObserver.unobserve(target);
      };
      targets.set(target, state);
      resizeObserver.observe(target);
      scheduleUpdate();
    };

    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR).forEach(addTarget);
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element) || node.closest(".kk-overlay-scrollbars")) continue;
          if (node.matches(CANDIDATE_SELECTOR)) addTarget(node as HTMLElement);
          scan(node);
        }
      }
      scheduleUpdate();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    addTarget(document.documentElement);
    scan(document);
    const onRootScroll = () => {
      const rootState = targets.get(document.documentElement);
      if (rootState) reveal(rootState);
    };
    window.addEventListener("scroll", onRootScroll, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    forcedColors.addEventListener("change", scheduleUpdate);
    document.fonts?.ready.then(scheduleUpdate);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onRootScroll, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
      forcedColors.removeEventListener("change", scheduleUpdate);
      if (frame) cancelAnimationFrame(frame);
      for (const state of targets.values()) state.cleanup();
      targets.clear();
      layer.remove();
    };
  }, []);

  return null;
}
