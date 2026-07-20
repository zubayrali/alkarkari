'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';

// The silsila as a sewn golden thread: the line draws downward with the
// scroll, and each master appears as a knot the thread passes through. The
// middle of the chain is gathered into one knot; the reader can unfurl it to
// sew through all twenty-nine links (the official document order, ending at
// Ibn Mashīsh and the seal). Proper names are not localized; labels come in
// as props. Masters with a page in the notebook become quiet stitch-links.

const CHAIN_HEAD = [
  'Shaykh Mohamed Faouzi al-Karkari',
  'Mulay al-Ḥasan al-Karkari',
  'Mulay al-Ṭahir al-Karkari',
  'Aḥmad al-ʿAlawi',
  'Muḥammad ibn al-Ḥabīb al-Būzīdi',
  'Muḥammad ibn Qaddūr al-Wakīli',
];
// links 7–27 of the official chain — the twenty-one gathered into one knot
const CHAIN_MID = [
  'Muḥammad ibn ʿAbd al-Qādir al-Bāshā',
  'Abū Yaʿzā al-Mahājī',
  'Mūlay al-ʿArbī ad-Darqāwī',
  'ʿAlī al-Jamal',
  'Muḥammad al-ʿArbī al-Fāsī',
  'Aḥmad ibn ʿAbd Allāh',
  'Qāsim al-Khaṣāṣī',
  'Muḥammad ibn ʿAbd Allāh',
  'ʿAbd ar-Raḥmān al-Fāsī',
  'Abū al-Maḥāsin Yūsuf al-Fāsī',
  'ʿAbd ar-Raḥmān al-Majdhūb',
  'ʿAlī as-Sanhājī ad-Duwwār',
  'Ibrāhīm al-Fahhām',
  'Aḥmad Zarrūq',
  'Aḥmad al-Ḥaḍramī',
  'Yaḥyā ibn Aḥmad al-Qādirī',
  'Aḥmad ibn Wafā',
  'Muḥammad Wafā',
  'Dāwūd al-Mākhilā',
  'Ibn ʿAṭāʾ Allāh as-Sakandarī',
  'Abū al-ʿAbbās al-Mursī',
];
const CHAIN_TAIL = ['Abū al-Ḥasan ash-Shādhili', 'ʿAbd as-Salām ibn Mashīsh'];

// masters who have their own page in the notebook → a quiet stitch-link
const HREF: Record<string, string> = {
  'Shaykh Mohamed Faouzi al-Karkari': '/history/shaykh-faouzi-al-karkari',
  'Aḥmad al-ʿAlawi': '/history/ahmad-al-alawi',
  'Abū al-Ḥasan ash-Shādhili': '/history/abu-al-hasan-al-shadhili',
  'ʿAbd as-Salām ibn Mashīsh': '/history/abd-al-salam-ibn-mashish',
};

function NameText({ name, seal }: { name: string; seal?: boolean }) {
  const href = HREF[name];
  const cls = seal ? 'text-lg sm:text-xl' : 'text-base sm:text-lg';
  const color = seal ? 'var(--kk-ember)' : 'var(--kk-night-fg)';
  if (href) {
    return (
      <Link href={href} className={`kk-link-stitch ${cls}`} style={{ color }}>
        {name}
      </Link>
    );
  }
  return <span className={cls} style={{ color }}>{name}</span>;
}

function Knot({
  children,
  gathered = false,
  seal = false,
  delay = 0,
}: {
  children: ReactNode;
  gathered?: boolean;
  seal?: boolean;
  delay?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.li
      className="relative flex items-baseline gap-5 pl-10"
      initial={reduced ? undefined : { opacity: 0, x: -8 }}
      animate={reduced ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <span
        aria-hidden
        className="absolute left-[13px] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={
          seal
            ? {
                width: 11,
                height: 11,
                background: 'var(--kk-lamp)',
                boxShadow: '0 0 14px color-mix(in srgb, var(--kk-lamp) 70%, transparent)',
              }
            : {
                width: 7,
                height: 7,
                background: gathered ? 'transparent' : 'var(--kk-gold)',
                border: gathered ? '1px dashed var(--kk-gold)' : 'none',
              }
        }
      />
      {children}
    </motion.li>
  );
}

export function ScrollTimeline({
  moreLabel,
  gatherLabel,
  sealLabel,
  linkLabel,
  linkHref,
}: {
  moreLabel: string;
  gatherLabel: string;
  sealLabel: string;
  linkLabel: string;
  linkHref: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <div ref={ref} className="relative">
      {/* The thread: a dashed rail the gold line is sewn over as you scroll. */}
      <span
        aria-hidden
        className="absolute bottom-2 left-[13px] top-2 w-px"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, var(--kk-night-muted) 0 4px, transparent 4px 9px)',
          opacity: 0.5,
        }}
      >
        <motion.span
          className="absolute inset-x-0 top-0 block origin-top"
          style={{
            height: '100%',
            scaleY: reduced ? 1 : drawn,
            backgroundImage: 'repeating-linear-gradient(to bottom, var(--kk-gold) 0 4px, transparent 4px 9px)',
            filter: 'drop-shadow(0 0 3px color-mix(in srgb, var(--kk-lamp) 55%, transparent))',
          }}
        />
      </span>

      <ol className="flex flex-col gap-7">
        {CHAIN_HEAD.map((name) => (
          <Knot key={name}>
            <NameText name={name} />
          </Knot>
        ))}

        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div
              key="unfurled"
              className="flex flex-col gap-7"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
            >
              {CHAIN_MID.map((name, idx) => (
                <Knot key={name} delay={reduced ? 0 : idx * 0.035}>
                  <NameText name={name} />
                </Knot>
              ))}
              <li className="pl-10">
                <button onClick={() => setOpen(false)} className="kk-label italic" style={{ color: 'var(--kk-night-muted)' }}>
                  ▲ {gatherLabel}
                </button>
              </li>
            </motion.div>
          ) : (
            <motion.li
              key="gathered"
              className="relative flex items-baseline gap-5 pl-10"
              initial={reduced ? undefined : { opacity: 0, x: -8 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
            >
              <span
                aria-hidden
                className="absolute left-[13px] top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'transparent', border: '1px dashed var(--kk-gold)' }}
              />
              <button
                onClick={() => setOpen(true)}
                className="kk-label italic text-left"
                style={{ color: 'var(--kk-night-muted)' }}
              >
                ▾ {moreLabel}
              </button>
            </motion.li>
          )}
        </AnimatePresence>

        {CHAIN_TAIL.map((name) => (
          <Knot key={name}>
            <NameText name={name} />
          </Knot>
        ))}
        <Knot seal>
          <NameText name={sealLabel} seal />
        </Knot>
      </ol>

      <p className="mt-10 pl-10">
        <Link href={linkHref} className="kk-link-stitch text-sm" style={{ color: 'var(--kk-night-fg)' }}>
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}
