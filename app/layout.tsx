import { RootProvider } from "@/components/root-provider";
import { i18nProvider } from "fumadocs-ui/i18n";
import { getSiteLanguage } from "@/lib/locale";
import { currentLocale, getLocaleEntry } from "@/lib/locales-manifest";
import { NavProgress } from "@/components/nav-progress";
import "./global.css";
import "./canvas-flow.css";
import "./excalidraw.css";
import "katex/dist/katex.css";
import { Inter, Amiri, Spectral, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

// Karkari typography (see DESIGN.md): Spectral headings, Amiri for Arabic/RTL,
// IBM Plex Mono for labels. Exposed as CSS vars; bound to elements in
// app/karkari-theme.css. Inter stays the body family via inter.className.
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        >
          <NavProgress />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
