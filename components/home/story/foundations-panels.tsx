'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Swatch } from '@/components/sewn/swatch';
import { patchOf } from '@/lib/patch';

// The seven founding principles as an expanding-panel rail — adapted from
// TomIsLoading's "vertical accordion" (21st.dev), re-cut for Primordial
// Light: no photographs, no icons — the open panel is a quiet room washed
// with that principle's patch colour, its Arabic name written large. Closed
// panels are thin spines (like books on a shelf); one is always open. On
// small screens the shelf stacks vertically and panels expand downward.

export interface FoundationCard {
  key: string;
  arabic: string;
  title: string;
  line: string;
  href: string;
}

function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

function Panel({
  card,
  open,
  setOpen,
  readOn,
  wide,
  reduced,
}: {
  card: FoundationCard;
  open: string;
  setOpen: Dispatch<SetStateAction<string>>;
  readOn: string;
  wide: boolean;
  reduced: boolean;
}) {
  const isOpen = open === card.key;
  const patch = patchOf(card.key);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(card.key)}
        className="group relative flex items-center gap-4 border-b border-fd-border bg-fd-card p-3 transition-colors hover:bg-fd-muted lg:w-14 lg:flex-col lg:justify-end lg:gap-5 lg:border-b-0 lg:border-r lg:py-5"
      >
        <span
          className="hidden text-base font-light text-fd-foreground lg:block"
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
        >
          {card.title}
        </span>
        <span className="text-base font-light text-fd-foreground lg:hidden">{card.title}</span>
        <span dir="rtl" lang="ar" className="kk-arabic text-sm text-fd-muted-foreground lg:order-first">
          {card.arabic}
        </span>
        <span className="ms-auto lg:ms-0">
          <Swatch patch={patch} size="0.85em" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`panel-${card.key}`}
            initial={reduced ? false : wide ? { width: 0 } : { height: 0 }}
            animate={wide ? { width: '100%' } : { height: 300 }}
            exit={reduced ? undefined : wide ? { width: 0 } : { height: 0 }}
            transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-w-0 overflow-hidden border-b border-fd-border bg-fd-card lg:h-full lg:border-b-0 lg:border-r"
          >
            {/* the room's wash — the one place this principle's colour breathes */}
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 130% at 85% 0%, color-mix(in srgb, var(--kk-patch-${patch}) 13%, transparent) 0%, transparent 62%)`,
              }}
            />
            <div className="relative flex h-full min-h-[300px] w-full flex-col justify-end p-6 sm:p-8">
              <span
                dir="rtl"
                lang="ar"
                className="kk-arabic pointer-events-none absolute right-6 top-10 sm:right-8"
                style={{ color: `var(--kk-patch-${patch})`, fontSize: 'clamp(52px, 6vw, 84px)', lineHeight: 1.3, opacity: 0.9 }}
              >
                {card.arabic}
              </span>
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.22, duration: 0.4 }}
                className="max-w-md"
              >
                <p className="text-xl font-light text-fd-foreground sm:text-2xl">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">{card.line}</p>
                <Link
                  href={card.href}
                  className="kk-link-stitch mt-5 inline-block text-sm text-fd-foreground"
                >
                  {readOn} →
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function FoundationsPanels({ cards, readOn }: { cards: FoundationCard[]; readOn: string }) {
  const [open, setOpen] = useState(cards[0]?.key ?? '');
  const wide = useIsWide();
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-fd-border lg:h-[420px] lg:flex-row">
      {cards.map((card) => (
        <Panel
          key={card.key}
          card={card}
          open={open}
          setOpen={setOpen}
          readOn={readOn}
          wide={wide}
          reduced={reduced}
        />
      ))}
    </div>
  );
}
