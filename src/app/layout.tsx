import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from "@vercel/analytics/next";
import {
  Geist,
  Geist_Mono,
  Nunito_Sans,
} from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";

const placardNext = localFont({
  src: '../../public/fonts/PlacardNextRegular.ttf',
  display: 'swap',
  variable: '--font-placard',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const garetStandIn = Nunito_Sans({
  variable: "--font-garet",
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
      <body
        // geistSans.className sets Geist as the default body font
        className={`${geistSans.className} ${placardNext.variable} ${geistSans.variable} ${geistMono.variable} ${garetStandIn.variable} antialiased`}
      >
        <ClerkProvider>
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}