import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { PwaRegister } from "@/components/pwa-register"
import { SentryListener } from "@/components/sentry-listener"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
})

export const metadata: Metadata = {
  title: "NutraLance - Votre compagnon nutrition intelligent",
  description:
    "Application de suivi nutritionnel premium pour la France et l'Algérie. Suivi des calories, macros, glycémie et composition corporelle.",
  generator: "v0.app",
  manifest: "/manifest.json",
  keywords: [
    "nutrition",
    "calories",
    "santé",
    "diabète",
    "glycémie",
    "régime",
    "poids",
    "macros",
  ],
  authors: [{ name: "NutraLance" }],
  creator: "NutraLance",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutraLance",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "NutraLance",
    title: "NutraLance - Votre compagnon nutrition intelligent",
    description:
      "Application de suivi nutritionnel premium pour la France et l'Algérie.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="bg-background">
      <body
        className={`${inter.variable} ${notoArabic.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PwaRegister />
          <SentryListener />
        </ThemeProvider>
      </body>
    </html>
  )
}
