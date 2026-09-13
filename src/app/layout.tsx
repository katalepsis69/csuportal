import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CETC Faculty Evaluation Portal',
  description: 'Faculty evaluation system for the CETC department.',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
