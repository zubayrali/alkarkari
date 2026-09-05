import { RootProvider } from "@/components/root-provider";
import { i18nProvider } from "fumadocs-ui/i18n";
import { getSiteLanguage } from "@/lib/locale";
import { currentLocale, getLocaleEntry } from "@/lib/locales-manifest";
import { NavProgress } from "@/components/nav-progress";
import { OverlayScrollbars } from "@/components/overlay-scrollbars";
import "./global.css";
import { Inter, Spectral, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { PublishingLiveRefresh } from "@/components/publishing-live-refresh";

const siteUrl = process.env.SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://zubayrali.github.io/alkarkari"
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

const inter = Inter({
  subsets: ["latin"],
});

// Karkari typography (see DESIGN.md): Spectral headings, Amiri for Arabic/RTL,
// IBM Plex Mono for labels. Exposed as CSS vars; bound to elements in
// app/karkari-theme.css. Inter stays the body family via inter.className.
// Amiri is self-hosted UNSUBSETTED (aliftype/amiri 1.002): the Google-served
// subset ships broken GPOS mark anchoring, so harakat render detached from
// their letters — glaring at display sizes.
const amiri = localFont({
  src: [
    { path: "./fonts/Amiri-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Amiri-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-amiri",
  // Arabic is rare on interior EN/FR pages — avoid ~290KB preload on every route.
  preload: false,
});

const spectral = Spectral({
  subsets: ["latin"],
  // Drop 500: site headings use 400/600/700.
  weight: ["400", "600", "700"],
  variable: "--font-spectral",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-plex",
});

const fontVars = `${inter.className} ${amiri.variable} ${spectral.variable} ${ibmPlexMono.variable}`;

const siteLanguage = getSiteLanguage();
const localeEntry = getLocaleEntry(currentLocale());

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteLanguage.htmlLang}
      dir={localeEntry.dir}
      className={fontVars}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss.xml" />
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('sidebar-collapsed')==='true')document.documentElement.dataset.sidebarCollapsed='true'}catch(e){}` }} />
      </head>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <RootProvider
          i18n={i18nProvider(siteLanguage.translations)}
          searchStrings={{
            placeholder: siteLanguage.searchPlaceholder,
            loading: siteLanguage.searchLoading,
            typeToBegin: siteLanguage.searchTypeToBegin,
            noResults: siteLanguage.searchNoResults,
            hintNavigate: siteLanguage.searchHintNavigate,
            hintOpen: siteLanguage.searchHintOpen,
            hintClose: siteLanguage.searchHintClose,
          }}
        >
          <NavProgress />
          <OverlayScrollbars />
          {process.env.NODE_ENV !== "production" && <PublishingLiveRefresh />}
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
