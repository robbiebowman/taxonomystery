import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taxonomy Mystery - Daily Wikipedia Puzzle",
  description: "Daily Wikipedia category puzzle. Find what these articles have in common!",
  icons: {
    icon: '/favicon.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const s = localStorage.getItem('theme'); const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; const t = s || sys; document.documentElement.dataset.theme = t; } catch (e) {} })();`
          }}
        />
      </head>
      <body className="antialiased">
        <div className="page-shell">
          {children}
        </div>
        <footer className="cmyk-footer" aria-hidden="true">
          <div className="cmyk-footer-inner">
            <div className="cmyk-blocks">
              <span className="cmyk-block cyan" />
              <span className="cmyk-block magenta" />
              <span className="cmyk-block yellow" />
              <span className="cmyk-block black" />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
