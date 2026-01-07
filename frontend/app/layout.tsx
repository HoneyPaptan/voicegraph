import type { Metadata } from 'next';
import './globals.css';
import {Geist} from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'VoiceGraph - AI-Powered Voice-to-Workflow Automation',
    template: '%s | VoiceGraph'
  },
  description: 'Transform your voice commands into automated workflows with visual graph interface. Build automation workflows using natural language, powered by Cerebras AI and Groq Whisper. Integrate with Notion, GitHub, Email, and more.',
  keywords: [
    'voice automation',
    'workflow automation',
    'AI workflow builder',
    'voice-to-workflow',
    'automation platform',
    'Cerebras AI',
    'visual workflow',
    'workflow builder',
    'automation tools',
    'voice commands',
    'natural language automation',
    'Notion automation',
    'GitHub automation',
    'AI automation'
  ],
  authors: [{ name: 'VoiceGraph Team' }],
  creator: 'VoiceGraph',
  publisher: 'VoiceGraph',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://voicegraph.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'VoiceGraph - AI-Powered Voice-to-Workflow Automation',
    description: 'Transform your voice commands into automated workflows with visual graph interface. Build automation workflows using natural language, powered by Cerebras AI.',
    siteName: 'VoiceGraph',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VoiceGraph - Voice-to-Workflow Automation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoiceGraph - AI-Powered Voice-to-Workflow Automation',
    description: 'Transform your voice commands into automated workflows with visual graph interface. Powered by Cerebras AI and Groq Whisper.',
    images: ['/og-image.png'],
    creator: '@voicegraph',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes if needed
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'automation',
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
