import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let rewriteTarget = rewriteSuffix(pathname);
  if (!rewriteTarget && isMarkdownPreferred(request)) {
    rewriteTarget = rewriteDocs(pathname);
  }

  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.nextUrl));
  }

  return NextResponse.next();
}
