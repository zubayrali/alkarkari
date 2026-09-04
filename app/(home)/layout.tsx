import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { HomeNavbar } from '@/components/home/home-navbar';

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions();
  return (
    <HomeLayout
      {...options}
      slots={{
        header: HomeNavbar,
      }}
    >
      {children}
    </HomeLayout>
  );
}
