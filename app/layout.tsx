import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileStickyBottomAd from "@/components/MobileStickyBottomAd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "US HOT NEWS | Breaking American News & Live Financial Wire",
    template: "%s | US HOT NEWS",
  },
  description: "Fast, verified, nonpartisan coverage of US Politics, Wall Street Markets, Silicon Valley Tech, Supreme Court, and National Developments.",
  keywords: [
    "US News",
    "Breaking News",
    "Wall Street",
    "US Politics",
    "CNBC news",
    "Economy",
    "Technology",
    "Supreme Court",
    "Financial Markets",
    "Washington DC"
  ],
  authors: [{ name: "US Hot News Editorial Board" }],
  creator: "US HOT NEWS",
  publisher: "US HOT NEWS Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    title: "US HOT NEWS | Breaking American News & Live Financial Wire",
    description: "Fast, verified, nonpartisan coverage of US Politics, Wall Street Markets, Silicon Valley Tech, Supreme Court, and National Developments.",
    url: siteUrl,
    siteName: "US HOT NEWS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        secureUrl: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "US HOT NEWS - Breaking News & Live Wire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "US HOT NEWS | Breaking American News & Live Financial Wire",
    description: "Fast, verified, nonpartisan coverage of US Politics, Wall Street Markets, Silicon Valley Tech, Supreme Court, and National Developments.",
    creator: "@ushotnews",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'US HOT NEWS',
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    sameAs: [
      'https://twitter.com/ushotnews',
      'https://facebook.com/ushotnews',
    ],
    publishingPrinciples: `${siteUrl}/ethics-policy`,
    diversityPolicy: `${siteUrl}/diversity-policy`,
    correctionsPolicy: `${siteUrl}/corrections-policy`,
  };

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google tag (gtag.js) - Active ONLY in production (does not count localhost) */}
        {isProduction && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-0135BLM6PS"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-0135BLM6PS', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <MobileStickyBottomAd />
        {children}
      </body>
    </html>
  );
}
