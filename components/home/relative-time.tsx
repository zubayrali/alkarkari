'use client';

import { useEffect, useState } from 'react';

// A build-time-safe relative timestamp. The site is a static export, so any
// "3d ago" computed on the server freezes at build time and drifts stale.
// SSR/first paint renders a deterministic absolute date (UTC — no timezone
// hydration mismatch); after mount we swap to a live relative time in the
// visitor's locale.

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

function formatRelative(iso: string, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let duration = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return '';
}

function formatAbsolute(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function RelativeTime({ iso, locale = 'en' }: { iso: string; locale?: string }) {
  const absolute = formatAbsolute(iso, locale);
  const [label, setLabel] = useState(absolute);

  useEffect(() => {
    setLabel(formatRelative(iso, locale));
  }, [iso, locale]);

  return <time dateTime={iso} title={absolute}>{label}</time>;
}
