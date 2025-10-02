import type { Metadata } from 'next';
import './globals.css';
import {Geist} from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'AI Workflow Orchestrator',
  description: 'Voice-powered workflow automation with Cerebras AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased ${geist.className}`}>{children}</body>
    </html>
  );
}
