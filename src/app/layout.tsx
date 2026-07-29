import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import {
  Geist,
  Geist_Mono,
  Audiowide,
  Electrolize,
  Tektur,
  Plus_Jakarta_Sans,
  IBM_Plex_Mono,
  Inter,
} from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// AIS Portal display / brand fonts (from Figma design system)
const audiowide = Audiowide({
  variable: "--font-audiowide",
  weight: "400",
  subsets: ["latin"],
});

const electrolize = Electrolize({
  variable: "--font-electrolize",
  weight: "400",
  subsets: ["latin"],
});

const tektur = Tektur({
  variable: "--font-tektur",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIS Portal",
  description: "AI Society at UT Dallas — member portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Analytics/>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${audiowide.variable} ${electrolize.variable} ${tektur.variable} ${jakarta.variable} ${ibmPlexMono.variable} ${inter.variable} antialiased`}
      >
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}