import { getLLMText, getPageMarkdownUrl, resolvePage, source } from '@/lib/source';
import { notFound } from 'next/navigation';

export async function GET(_: Request, { params }: RouteContext<'/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = resolvePage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export function generateStaticParams() {
  return source.getPages().filter((page) => !page.data.unlisted).map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}
