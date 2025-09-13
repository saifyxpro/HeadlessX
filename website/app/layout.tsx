import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
  description: 'Professional browserless web scraping API with human-like behavior simulation, anti-detection techniques, and comprehensive automation features.',
  keywords: 'headlessx, browserless, web scraping, playwright, automation, api, javascript rendering, anti-detection, human behavior',
  authors: [{ name: 'SaifyXPRO' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
    description: 'Professional browserless web scraping API with human-like behavior simulation and anti-detection techniques.',
    type: 'website',
    url: 'https://headless.saify.me',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
    description: 'Professional browserless web scraping API with human-like behavior simulation.',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}