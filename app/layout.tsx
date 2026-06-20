import { RootProvider } from "@/components/root-provider";
import { i18nProvider } from "fumadocs-ui/i18n";
import { getSiteLanguage } from "@/lib/locale";
import { NavProgress } from "@/components/nav-progress";
import "./global.css";
import "./canvas-flow.css";
import "./excalidraw.css";
import "katex/dist/katex.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const siteLanguage = getSiteLanguage();

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteLanguage.htmlLang} className={inter.className} suppressHydrationWarning>
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
