import { getPageImage, resolvePage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { appName } from '@/lib/shared';

export const dynamicParams = false;

export async function GET(_: Request, { params }: RouteContext<'/og/[...slug]'>) {
  const { slug } = await params;
  const page = resolvePage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '60px 80px',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 14,
            color: '#888',
            marginBottom: 20,
          }}
        >
          {appName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {page.data.title}
        </div>
        {page.data.description && (
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: '#888',
              marginTop: 20,
              lineHeight: 1.4,
            }}
          >
            {page.data.description}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return source.getPages().filter((page) => !page.data.unlisted).map((page) => ({
    slug: getPageImage(page).segments,
  }));
}
