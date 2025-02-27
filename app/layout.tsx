import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import MainNav from '@/components/layout/main-nav'
import SiteFooter from '@/components/layout/site-footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PokéTracker - Track Your Pokemon Card Collection',
  description: 'A web application to browse, track, and manage your Pokemon card collection.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
          <MainNav />
          
          <main className="flex-1 py-8 md:py-12">
            <div className="container mx-auto px-4 md:px-6">
              {children}
            </div>
          </main>
          
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  )
}