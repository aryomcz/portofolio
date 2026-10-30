import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/hooks/useSmoothScroll";
import { PageTransitionProvider } from "@/components/ui/PageTransition";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { AdaptiveNavbar } from "@/components/ui/AdaptiveNavbar";
import { TopographicBg } from "@/components/ui/TopographicBg";
import { Preloader } from "@/components/ui/Preloader";
import { PORTFOLIO_DATA } from "@/data/portfolio";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const antonDisplay = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${antonDisplay.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative min-h-screen flex flex-col bg-bg-primary text-text-primary transition-colors duration-500">
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
