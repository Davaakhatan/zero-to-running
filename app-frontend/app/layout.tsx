import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Random Quote Generator',
  description: 'A simple app to demonstrate dashboard monitoring',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
