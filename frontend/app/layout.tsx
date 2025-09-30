import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
