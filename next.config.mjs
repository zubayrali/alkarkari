import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
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
    ],
  },
};

export default withMDX(config);
