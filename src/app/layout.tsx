import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { Providers } from './providers'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-geist',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
})

const TITLE = 'Aider — a USDC wallet for AI agents'
const DESCRIPTION =
  'Your agent spends. You stay in control. Give each AI agent its own key with limits on Arc: small payments go through on their own, bigger ones wait for your approval, and one click cuts an agent off.'

export const metadata: Metadata = {
  title: { default: TITLE, template: '%s · Aider' },
  description: DESCRIPTION,
  applicationName: 'Aider',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Aider',
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1112' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7f6' },
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        {/* Applies the saved theme before first paint (static script, our own code). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
