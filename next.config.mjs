import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const isDevelopment = process.env.NODE_ENV === 'development';
const developmentPageExtensions = isDevelopment
  ? ['dev.tsx', 'dev.ts']
  : [];

/** @type {import('next').NextConfig} */
const config = {
  // Keystatic local mode needs a server in development. Production remains a
  // static export, where the *.dev.ts(x) routes below are not discovered.
  output: isDevelopment ? undefined : 'export',
  // Keystatic's App Router files use *.dev.ts(x), so they are routes only
  // under next dev and cannot enter the production static export.
  pageExtensions: [
    ...developmentPageExtensions,
    'mdx',
    'md',
    'jsx',
    'js',
    'tsx',
    'ts',
  ],
  basePath: process.env.PAGES_BASE_PATH || '',
  serverExternalPackages: ['rehype-citation'],
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.PAGES_BASE_PATH || '',
    // Inlined so client components know which isolated locale build this is.
    NEXT_PUBLIC_SITE_LANGUAGE: process.env.SITE_LANGUAGE || 'en',
  },
  reactStrictMode: true,
  experimental: {
    viewTransition: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: 'les7lectures.com' },
    ],
  },
};

export default withMDX(config);
