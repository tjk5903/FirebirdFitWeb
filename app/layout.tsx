import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppStateProvider } from '@/contexts/AppStateContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Firebird Fit - Performance Dashboard',
  description: 'Modern fitness tracking and team management platform for athletes and coaches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AppStateProvider>
            <div className="min-h-screen bg-soft-white">
              {children}
            </div>
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 