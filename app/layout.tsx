import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memelli',
  description: 'Credit, funding, and business — one account.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
