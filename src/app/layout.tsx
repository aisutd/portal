import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from "@vercel/analytics/next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const placard = Bricolage_Grotesque({
  variable: "--font-placard",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
        className={`${inter.variable} ${placard.variable} antialiased`}
      >
        <ClerkProvider>
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}