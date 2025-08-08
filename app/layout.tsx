import type { Metadata } from 'next'
import { Inter as GeistSansFont } from 'next/font/google'
import { Roboto_Mono as GeistMonoFont } from 'next/font/google'

export const GeistSans = GeistSansFont({ subsets: ['latin'] })
export const GeistMono = GeistMonoFont({ subsets: ['latin'] })
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
