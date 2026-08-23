import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { AccountProvider } from "@/components/account-provider";
import { getNavAccount } from "@/lib/nav-account";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import localFont from 'next/font/local';

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const placard = localFont({
  src: '../../public/fonts/PlacardNextRegular.ttf',
  display: 'swap',
  variable: "--font-placard",
  //subsets: ["latin"],
  //weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AIS Portal",
  description: "AI Society at UT Dallas — member portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const account = await getNavAccount();

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${placard.variable} antialiased`}
      >
        <ClerkProvider>
          <AccountProvider account={account}>{children}</AccountProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}