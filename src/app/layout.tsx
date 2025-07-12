import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taxonomy Mystery - Daily Wikipedia Puzzle",
  description: "Daily Wikipedia category puzzle. Find what these articles have in common!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
