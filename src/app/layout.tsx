import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

// Make the layout use the real device width on mobile browsers.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#170b2b",
};
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthProvider";
import { HandleOnComplete } from "@/lib/router-events";
import siteMetadata from "@/lib/seo/siteMetadata";
export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    template: `%s | ${siteMetadata.title}`,
    default: siteMetadata.title,
  },
  description: siteMetadata.description,
  manifest: "/manifest.webmanifest",
  verification: {
    google: "szmpKHR7f-jtqxvxFdvK7ismjGCuN8yGnF9JoBy_SW0",
  },
  keywords:
    "PerDex, manga, manhwa, manhua, komik, baca komik, chapter terbaru",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon.png",
    },
  ],
  alternates: {
    canonical: siteMetadata.siteUrl,
    languages: { "id-ID": siteMetadata.siteUrl },
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.socialBanner],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className} suppressHydrationWarning={true}>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
          <HandleOnComplete />
      </body>
    </html>
  );
}