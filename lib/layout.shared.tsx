import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';
import { getSiteLanguage } from './locale';

// NOTE: the LocaleSwitcher is deliberately NOT in these shared links — nav
// links get folded into the docs sidebar, which already mounts the switcher
// as its banner (it would appear twice). The home layout adds its own nav
// instance (app/(home)/layout.tsx).
export function baseOptions(): BaseLayoutProps {
  const lang = getSiteLanguage();
  return {
    nav: {
      title: appName,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      // The notebook's own index (hand-maintained content/start-here.mdx per
      // locale) — the home page is just the welcome mat.
      { text: lang.navStartHere,  url: '/start-here', active: 'url',        on: 'nav' },
      { text: lang.navDictionary, url: '/dictionary', active: 'nested-url', on: 'nav' },
      { text: lang.navBooks,      url: '/books',      active: 'nested-url', on: 'nav' },
      { text: lang.navPodcasts,   url: '/podcasts',   active: 'nested-url', on: 'nav' },
    ],
  };
}
