"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  applyOutcome,
  CardState,
  formatInterval,
  INITIAL_INTERVAL_MS,
  newCard,
  type Outcome,
} from "@/lib/spaced-repetition";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { registerPrompts } from "@/lib/review-store";

interface Prompt {
  id: string;
  question: string;
  answer: string;
  questionAttachment?: string;
  answerAttachment?: string;
}

const STORE_KEY = "orbit-review-v1";
const LOOKAHEAD_MS = 16 * 60 * 60 * 1000; // 16 hours
type Store = Record<string, CardState>;

function loadStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
}

function decode(b64: string): Prompt[] {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/* ── Color theming ── */

const COLOR_PALETTES: Record<string, { bg: string; accent: string; fg: string }> = {
  red:       { bg: "oklch(0.95 0.02 25)",   accent: "oklch(0.55 0.2 25)",   fg: "#fff" },
  orange:    { bg: "oklch(0.95 0.02 55)",   accent: "oklch(0.6 0.18 55)",   fg: "#fff" },
  yellow:    { bg: "oklch(0.96 0.02 90)",   accent: "oklch(0.65 0.15 90)",  fg: "#1a1a1a" },
  green:     { bg: "oklch(0.95 0.02 145)",  accent: "oklch(0.55 0.15 145)", fg: "#fff" },
  turquoise: { bg: "oklch(0.95 0.02 180)",  accent: "oklch(0.55 0.12 180)", fg: "#fff" },
  cyan:      { bg: "oklch(0.95 0.02 200)",  accent: "oklch(0.55 0.12 200)", fg: "#fff" },
  blue:      { bg: "oklch(0.95 0.02 240)",  accent: "oklch(0.55 0.15 240)", fg: "#fff" },
  violet:    { bg: "oklch(0.95 0.02 280)",  accent: "oklch(0.55 0.18 280)", fg: "#fff" },
  purple:    { bg: "oklch(0.95 0.02 300)",  accent: "oklch(0.55 0.18 300)", fg: "#fff" },
  pink:      { bg: "oklch(0.95 0.02 340)",  accent: "oklch(0.55 0.15 340)", fg: "#fff" },
};

function colorStyle(color?: string): React.CSSProperties | undefined {
  const p = color ? COLOR_PALETTES[color] : undefined;
  if (!p) return undefined;
  return {
    "--rv-color-bg": p.bg,
    "--rv-color-accent": p.accent,
    "--rv-color-accent-fg": p.fg,
  } as React.CSSProperties;
}

/* ── Progress timeline milestones ── */

const MILESTONES = [
  { label: "New", ms: 0 },
  { label: "Learning", ms: INITIAL_INTERVAL_MS },
  { label: "Short-term", ms: 14 * 86_400_000 },
  { label: "Medium-term", ms: 60 * 86_400_000 },
  { label: "Long-term", ms: 180 * 86_400_000 },
];

function milestoneIndex(intervalMs: number): number {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (intervalMs >= MILESTONES[i].ms) return i;
  }
  return 0;
}

function ProgressTimeline({ intervalMs }: { intervalMs: number }) {
  const idx = milestoneIndex(intervalMs);
  const pct = (idx / (MILESTONES.length - 1)) * 100;

  return (
    <div className="rv-timeline">
      <div className="rv-timeline-track">
        <div className="rv-timeline-fill" style={{ width: `${pct}%` }} />
        <svg
          className="rv-timeline-arrow"
          width="7"
          height="10"
          viewBox="0 0 7 10"
        >
          <path d="M0 10V0L7 5Z" fill="currentColor" />
        </svg>
      </div>
      <div className="rv-timeline-items">
        {MILESTONES.map((m, i) => (
          <div
            key={i}
            className={`rv-timeline-item${i === idx ? " current" : i < idx ? " past" : ""}`}
          >
            <span className="rv-timeline-label">{m.label}</span>
            <div className="rv-timeline-dot">
              {i === idx && <div className="rv-timeline-ring" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Marquee cover ── */

const MARQUEE_ROWS = 9;

function MarqueeCover() {
  return (
    <div className="rv-marquee">
      {Array.from({ length: MARQUEE_ROWS }, (_, i) => (
        <p
          key={i}
          style={{
            animationDelay: `${-i * 13}s`,
            animationDirection:
              i % 2 === 0 ? "alternate" : "alternate-reverse",
          }}
        >
          {Array.from({ length: 5 }, (_, j) => (
            <span key={j}>Click anywhere to reveal</span>
          ))}
        </p>
      ))}
    </div>
  );
}

/* ── Attachment image ── */

function Attachment({ src }: { src: string }) {
  return (
    <span className="rv-attachment">
      <ImageZoom src={src} alt="" loading="lazy" width={400} height={300} />
    </span>
  );
}

/* ── Icons ── */

function RotateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 31 31" fill="none">
      <path
        d="M15.5 7C10.2533 7 6 11.2533 6 16.5C6 21.7467 10.2533 26 15.5 26C20.7467 26 25 21.7467 25 16.5C25 15.3037 24.7789 14.159 24.3752 13.1046"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M15 11.5V2.5L22 7L15 11.5Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 33 33" fill="none">
      <path
        d="M5.99981 18.5564L13.778 26.3345L26.7416 8.18545"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Component ── */

type Mode =
  | { kind: "idle" }
  | { kind: "reviewing"; queue: Prompt[]; pos: number; revealed: boolean }
  | { kind: "done" };

export function ReviewBlock({
  configBase64,
  color,
}: {
  configBase64: string;
  color?: string;
}) {
  const [prompts] = useState<Prompt[]>(() => {
    try {
      return decode(configBase64);
    } catch {
      return [];
    }
  });
  const [store, setStore] = useState<Store | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const s = loadStore();
    setStore(s);
    const now = Date.now();
    const horizon = now + LOOKAHEAD_MS;
    const due = prompts.filter((p) => {
      const card = s[p.id] ?? newCard(now);
      return card.dueTimestampMillis <= horizon;
    });
    if (due.length > 0) {
      setMode({ kind: "reviewing", queue: due, pos: 0, revealed: false });
    }
  }, [prompts]);

  useEffect(() => registerPrompts(configBase64, prompts), [configBase64, prompts]);

  const grade = useCallback(
    (outcome: Outcome) => {
      if (mode.kind !== "reviewing" || !store) return;
      const prompt = mode.queue[mode.pos];
      const now = Date.now();
      const card = store[prompt.id] ?? newCard(now);
      const updated = applyOutcome(card, now, outcome);
      const next = { ...store, [prompt.id]: updated };
      setStore(next);
      saveStore(next);
      window.dispatchEvent(new CustomEvent("orbit-store-update"));

      const nextPos = mode.pos + 1;
      if (nextPos >= mode.queue.length) setMode({ kind: "done" });
      else
        setMode({
          kind: "reviewing",
          queue: mode.queue,
          pos: nextPos,
          revealed: false,
        });
    },
    [mode, store],
  );

  const reveal = useCallback(() => {
    if (mode.kind === "reviewing" && !mode.revealed) {
      setMode({ ...mode, revealed: true });
    }
  }, [mode]);

  // Keyboard shortcuts (Space to reveal/remember, 1=forgot, 2=remembered, 3=skip)
  useEffect(() => {
    if (mode.kind !== "reviewing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        if (!mode.revealed) reveal();
        else grade("remembered");
      } else if (mode.revealed) {
        if (e.key === "1") grade("forgotten");
        else if (e.key === "2") grade("remembered");
        else if (e.key === "3") grade("skipped");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, reveal, grade]);

  if (prompts.length === 0) return null;
  if (store === null) return <div className="rv-block" aria-busy="true" />;

  const now = Date.now();
  const cardFor = (p: Prompt) => store[p.id] ?? newCard(now);

  const startReview = () => {
    const horizon = now + LOOKAHEAD_MS;
    const due = prompts.filter((p) => cardFor(p).dueTimestampMillis <= horizon);
    const queue = due.length > 0 ? due : prompts;
    setMode({ kind: "reviewing", queue, pos: 0, revealed: false });
  };

  const themed = color ? "rv-themed" : "";

  /* ── Reviewing ── */
  if (mode.kind === "reviewing") {
    const { queue, pos, revealed } = mode;
    const prompt = queue[pos];
    const intervalMs = cardFor(prompt).intervalMillis;
    const remaining = queue.length - pos;

    return (
      <div
        className={`rv-block rv-active ${themed}`}
        style={colorStyle(color)}
      >
        <div
          className="rv-area"
          onClick={!revealed ? reveal : undefined}
          style={{ cursor: !revealed ? "pointer" : undefined }}
        >
          {/* Card stack */}
          <div className="rv-stack">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={pos}
                className="rv-card-wrap"
                style={{ zIndex: 4 }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: -30, scale: 0.96 }
                }
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="rv-card">
                  <div className="rv-prompt">
                    <p>{prompt.question}</p>
                    {prompt.questionAttachment && (
                      <Attachment src={prompt.questionAttachment} />
                    )}
                  </div>
                  <div className="rv-answer-area">
                    <div className={`rv-answer${revealed ? " visible" : ""}`}>
                      <p>{prompt.answer}</p>
                      {prompt.answerAttachment && (
                        <Attachment src={prompt.answerAttachment} />
                      )}
                    </div>
                    <div
                      className={`rv-level${revealed ? " visible" : ""}`}
                    >
                      <ProgressTimeline intervalMs={intervalMs} />
                    </div>
                    {!revealed && (
                      <div className="rv-cover">
                        <MarqueeCover />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stack edges */}
            {remaining > 1 && <div className="rv-edge rv-edge-1" />}
            {remaining > 2 && <div className="rv-edge rv-edge-2" />}
          </div>

          {/* Grade buttons */}
          <div className="rv-buttons">
            <button
              className={`rv-btn rv-forgot${!revealed ? " disabled" : ""}`}
              disabled={!revealed}
              onClick={(e) => {
                e.stopPropagation();
                grade("forgotten");
              }}
            >
              <RotateIcon />
              Didn&#8217;t remember
            </button>
            <button
              className={`rv-btn rv-skip${!revealed ? " disabled" : ""}`}
              disabled={!revealed}
              onClick={(e) => {
                e.stopPropagation();
                grade("skipped");
              }}
            >
              <SkipIcon />
              Skip
            </button>
            <button
              className={`rv-btn rv-remembered${!revealed ? " disabled" : ""}`}
              disabled={!revealed}
              onClick={(e) => {
                e.stopPropagation();
                grade("remembered");
              }}
            >
              <CheckIcon />
              Remembered
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (mode.kind === "done") {
    return (
      <div
        className={`rv-block rv-done-block ${themed}`}
        style={colorStyle(color)}
      >
        <div className="rv-done">
          <CheckIcon />
          <p>Review complete — these will return when they&#8217;re due.</p>
          <button className="rv-restart" onClick={startReview}>
            Review again
          </button>
        </div>
      </div>
    );
  }

  /* ── Idle (compact chip) ── */
  const mastered = prompts.filter(
    (p) => cardFor(p).intervalMillis >= MILESTONES[2].ms,
  ).length;
  const nextDue = prompts
    .map((p) => cardFor(p).dueTimestampMillis)
    .filter((t) => t > now)
    .sort((a, b) => a - b)[0];
  const dueSoon =
    nextDue && nextDue <= now + LOOKAHEAD_MS
      ? `due in ${formatInterval(nextDue - now)}`
      : undefined;

  return (
    <div
      className={`rv-block rv-idle ${themed}`}
      style={colorStyle(color)}
    >
      <div className="rv-idle-inner">
        <div className="rv-idle-status">
          <span className="rv-idle-chip">
            <CheckIcon />
            {mastered}/{prompts.length} mastered
          </span>
          {dueSoon && <span className="rv-idle-due">{dueSoon}</span>}
          {!dueSoon && nextDue && (
            <span className="rv-idle-due">
              next in {formatInterval(nextDue - now)}
            </span>
          )}
        </div>
        <button className="rv-restart" onClick={startReview}>
          Review{dueSoon ? "" : " anyway"}
        </button>
      </div>
    </div>
  );
}
