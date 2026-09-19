import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// One type family (MASTER.md v2). Both CSS var names are kept so existing
// `font-display` / `font-sans` classes keep working - same face, two weights.
const interSans = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const interDisplay = Inter({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CSU CETC Faculty Evaluation Portal',
  description: 'Faculty evaluation system for the College of Engineering, Technology and Computing - Cotabato State University.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${interDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}