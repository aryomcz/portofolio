import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/hooks/useSmoothScroll";
import { AdaptiveNavbar } from "@/components/ui/AdaptiveNavbar";
import { TopographicBg } from "@/components/ui/TopographicBg";
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
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
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
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
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
      <body className="relative min-h-screen flex flex-col bg-bg-primary text-text-primary">
        <TopographicBg />
        <SmoothScrollProvider>
          <AdaptiveNavbar />
          <div className="relative z-10 flex-1">{children}</div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
