import { source } from '@/lib/source';
import { appName } from '@/lib/shared';

export const dynamic = 'force-static';

export async function GET() {
  const pages = source.getPages();
  const body = pages
    .map((page) => `- [${page.data.title}](${page.url})`)
    .join('\n');

  return new Response(`# ${appName}\n\n${body}\n`);
}
