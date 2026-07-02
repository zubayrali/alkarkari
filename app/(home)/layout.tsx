import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions();
  return (
    <HomeLayout
      {...options}
      // The docs layout mounts the switcher in its sidebar banner; the home
      // layout has no sidebar, so it gets a navbar instance instead.
      links={[
        ...(options.links ?? []),
        { type: 'custom', secondary: true, children: <LocaleSwitcher /> },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
