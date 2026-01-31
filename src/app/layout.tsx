import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "eles.ai — Create AI Bots in Minutes",
  description: "The easiest way to launch your own AI bot. Chat on the web, join social spaces.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
