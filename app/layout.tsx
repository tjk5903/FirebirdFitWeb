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

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Firebird Fit - Performance Dashboard',
  description: 'Modern fitness tracking and team management platform for athletes and coaches',
  icons: {
    icon: [
      { url: '/firebird-mascot.png', sizes: '192x192', type: 'image/png' },
      { url: '/firebird-mascot.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/firebird-mascot.png',
  },
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Firebird Fit',
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