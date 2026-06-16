import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { text: 'Dictionary', url: '/dictionary', active: 'nested-url', on: 'nav' },
      { text: 'Books',      url: '/books',      active: 'nested-url', on: 'nav' },
      { text: 'Podcasts',   url: '/podcasts',   active: 'nested-url', on: 'nav' },
    ],
  };
}
