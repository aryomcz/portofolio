import type { Metadata } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "@/hooks/useSmoothScroll";
import { PageTransitionProvider } from "@/components/ui/PageTransition";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { AdaptiveNavbar } from "@/components/ui/AdaptiveNavbar";
import { TopographicBg } from "@/components/ui/TopographicBg";
import { Preloader } from "@/components/ui/Preloader";
import { PORTFOLIO_DATA } from "@/data/portfolio";

export const metadata: Metadata = {
  title: `${PORTFOLIO_DATA.owner.fullName} — Full-Stack Developer & System Analyst`,
  description: PORTFOLIO_DATA.owner.bioSummary,
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      var theme = (saved === 'dark' || saved === 'light') ? saved : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className="antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative min-h-screen flex flex-col bg-bg-primary text-text-primary">
        <SmoothScrollProvider>
        <ScrollProgressBar />
        <TopographicBg />
          <Preloader />
          <PageTransitionProvider>
            <AdaptiveNavbar />
            <div className="relative z-10 flex-1">{children}</div>
          </PageTransitionProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
