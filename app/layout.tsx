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
  title: 'PokéShelf - Track Your Pokemon Card Collection',
  description: 'A web application to browse, track, and manage your Pokemon card collection.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={{
        layout: {
          termsPageUrl: "/terms",
          privacyPageUrl: "/privacy"
        },
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
          footerActionLink: "text-primary hover:text-primary/90"
        }
      }}
    >
      <html lang="en">
        <head>
          <meta name='impact-site-verification' content='ac021e01-0456-4678-8d74-04bbea34ed92' />
        </head>
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