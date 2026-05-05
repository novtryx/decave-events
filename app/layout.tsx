import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Philosopher } from "next/font/google";


const philosopher = Philosopher({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-philosopher',
})


export const metadata: Metadata = {
  title: {
    default: "deCave | Exclusive Events & Premium Experiences",
    template: "%s | deCave",
  },
  description:
    "deCave is the official home of exclusive, high-end events. Discover curated nightlife experiences, secure premium tickets, and step into unforgettable moments.",
  keywords: [
    "deCave",
    "exclusive events",
    "luxury nightlife",
    "premium event tickets",
    "VIP events",
    "private events",
    "elite experiences",
    "official event tickets",
  ],
  authors: [{ name: "deCave" }],
  creator: "deCave",
  publisher: "deCave",
  metadataBase: new URL("https://decavemgt.com"),
  openGraph: {
    title: "deCave | Exclusive Events & Premium Experiences",
    description:
      "Official ticket access to deCave’s curated luxury events. Premium vibes, seamless entry, unforgettable nights.",
    url: "https://decavemgt.com",
    siteName: "deCave",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "deCave Luxury Nightlife Experience",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "deCave | Exclusive Events & Premium Experiences",
    description:
      "Step into deCave's world of curated luxury events and premium nightlife experiences.",
    images: ["/logo.svg"],
  },
    icons: {
    icon: "/logo.svg",          // browser tab
    shortcut: "/logo.svg",      // shortcut icon
    apple: "/logo.svg",         // iOS home screen
  },
  
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${philosopher.variable} font-philosopher h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
           {children}
        </Providers>
       </body>
    </html>
  );
}
