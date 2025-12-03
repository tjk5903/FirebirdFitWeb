import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { TeamProvider } from '@/contexts/TeamContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { GlobalLoadingManager } from '@/components/ui/GlobalLoadingManager'
import HydrationFix from '@/components/ui/HydrationFix'
import PWANavigationInterceptor from '@/components/ui/PWANavigationInterceptor'

const inter = Inter({ subsets: ['latin'] })

// Get the base URL for absolute image URLs (required for social media)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.firebirdfit.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Firebird Fit - Performance Dashboard',
  description: 'Modern fitness tracking and team management platform for athletes and coaches',
  icons: {
    icon: [
      { url: '/firebird-mascot.png', sizes: '32x32', type: 'image/png' },
      { url: '/firebird-mascot.png', sizes: '16x16', type: 'image/png' },
      { url: '/firebird-mascot.png', sizes: '192x192', type: 'image/png' },
      { url: '/firebird-mascot.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/firebird-mascot.png',
    shortcut: '/firebird-mascot.png',
  },
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Firebird Fit',
  },
  openGraph: {
    type: 'website',
    title: 'Firebird Fit - Performance Dashboard',
    description: 'Modern fitness tracking and team management platform for athletes and coaches',
    siteName: 'Firebird Fit',
    images: [
      {
        url: '/firebird-mascot.png',
        width: 512,
        height: 512,
        alt: 'Firebird Fit Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Firebird Fit - Performance Dashboard',
    description: 'Modern fitness tracking and team management platform for athletes and coaches',
    images: ['/firebird-mascot.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <TeamProvider>
              <ThemeProvider>
                <AppStateProvider>
                  <ToastProvider>
                    <GlobalLoadingManager>
                      <HydrationFix />
                      <PWANavigationInterceptor />
                      <div className="min-h-screen bg-soft-white dark:bg-slate-900 transition-colors duration-300">
                        {children}
                      </div>
                    </GlobalLoadingManager>
                  </ToastProvider>
                </AppStateProvider>
              </ThemeProvider>
            </TeamProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
} 