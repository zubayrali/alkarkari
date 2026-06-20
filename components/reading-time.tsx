import { Clock } from 'lucide-react';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';

const WORDS_PER_MINUTE = 200;

function countWords(data: StructuredData): number {
  let count = 0;
  for (const block of data.contents) {
    count += block.content.split(/\s+/).filter(Boolean).length;
  }
  for (const heading of data.headings) {
    count += heading.content.split(/\s+/).filter(Boolean).length;
  }
  return count;
}

export function ReadingTime({
  structuredData,
  label,
}: {
  structuredData: StructuredData;
  label: string;
}) {
  const words = countWords(structuredData);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return (
    <div className="flex items-center gap-1.5 text-xs text-fd-muted-foreground pb-3">
      <Clock className="size-3.5" />
      <span>
        {minutes} {label} · {words.toLocaleString()} words
      </span>
    </div>
  );
}
