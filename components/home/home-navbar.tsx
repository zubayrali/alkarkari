'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useHomeLayout } from 'fumadocs-ui/layouts/home';
import {
  isLinkItemActive,
  type LinkItemType,
  type MainItemType,
} from 'fumadocs-ui/layouts/shared';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { SiteIdentity } from '@/components/site-identity';

function isMainItem(item: LinkItemType): item is MainItemType {
  return item.type === undefined || item.type === 'main';
}

export function HomeNavbar() {
  const pathname = usePathname() || '/';
  const { navItems, slots } = useHomeLayout();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const items = navItems.filter(isMainItem);

  const SearchTrigger = slots.searchTrigger && slots.searchTrigger.full;
  const SearchTriggerSmall = slots.searchTrigger && slots.searchTrigger.sm;
  const ThemeSwitch = slots.themeSwitch;

  return (
    <header
      className="kk-home-nav"
      data-menu-open={menuOpen}
    >
      <div className="kk-home-nav-shell">
        <Link href="/" className="kk-home-nav-brand" aria-label="Karkari Wiki home">
          <span className="kk-home-nav-mark" aria-hidden>
            <span />
          </span>
          <SiteIdentity />
        </Link>

        <nav className="kk-home-nav-links" aria-label="Primary navigation">
          {items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className="kk-home-nav-link"
              data-active={isLinkItemActive(item, pathname)}
              aria-current={isLinkItemActive(item, pathname) ? 'page' : undefined}
            >
              {item.text}
            </Link>
          ))}
        </nav>

        <div className="kk-home-nav-tools">
          {SearchTrigger && (
            <SearchTrigger
              hideIfDisabled
              className="kk-home-search-trigger"
            />
          )}
          <div className="kk-home-nav-desktop-tool">
            <LocaleSwitcher />
          </div>
          {ThemeSwitch && (
            <div className="kk-home-nav-desktop-tool">
              <ThemeSwitch />
            </div>
          )}
          {SearchTriggerSmall && (
            <SearchTriggerSmall
              hideIfDisabled
              className="kk-home-search-trigger-small"
            >
              <Search aria-hidden />
            </SearchTriggerSmall>
          )}
          <button
            type="button"
            className="kk-home-nav-menu-trigger"
            aria-expanded={menuOpen}
            aria-controls="kk-home-mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>

      <div id="kk-home-mobile-menu" className="kk-home-mobile-menu" hidden={!menuOpen}>
        <nav aria-label="Mobile navigation" className="kk-home-mobile-links">
          {items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className="kk-home-mobile-link"
              data-active={isLinkItemActive(item, pathname)}
            >
              <span className="kk-home-mobile-link-mark" aria-hidden />
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>
        <div className="kk-home-mobile-tools">
          <LocaleSwitcher />
          {ThemeSwitch && <ThemeSwitch />}
        </div>
      </div>
    </header>
  );
}
