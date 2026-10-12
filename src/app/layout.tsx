import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContainer";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { LoginModal } from "@/components/LoginModal";

const PRODUCTION_SITE_URL = "https://thinksy-web.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_URL),
  title: "THINKSY – A Space Where Your Thoughts Can Breathe",
  description:
    "THINKSY is a private space to capture, organize, and reflect on your thoughts. Give your thoughts a place to breathe.",
  keywords: [
    "thinksy",
    "thoughts",
    "private thoughts",
    "reflect on thoughts",
    "organize thoughts",
    "capture thoughts",
    "mindful notes",
    "digital space",
  ],
  alternates: {
    canonical: PRODUCTION_SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "THINKSY – A Space Where Your Thoughts Can Breathe",
    description:
      "THINKSY is a private space to capture, organize, and reflect on your thoughts. Give your thoughts a place to breathe.",
    url: PRODUCTION_SITE_URL,
    siteName: "THINKSY",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "THINKSY Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "THINKSY – A Space Where Your Thoughts Can Breathe",
    description:
      "THINKSY is a private space to capture, organize, and reflect on your thoughts. Give your thoughts a place to breathe.",
    images: ["/logo.png"],
  },
  verification: {
    google: "ZeyFhGlDg_UN_jD-rxCQZyWs_52qgewqqIFRfGz7dJs",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c091d",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://thinksy-web.vercel.app/#website",
      "url": "https://thinksy-web.vercel.app/",
      "name": "THINKSY",
      "description":
        "THINKSY is a private space to capture, organize, and reflect on your thoughts. Give your thoughts a place to breathe.",
      "inLanguage": "en"
    },
    {
      "@type": "WebApplication",
      "@id": "https://thinksy-web.vercel.app/#webapp",
      "url": "https://thinksy-web.vercel.app/",
      "name": "THINKSY",
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "description":
        "THINKSY is a private space to capture, organize, and reflect on your thoughts. Give your thoughts a place to breathe.",
      "image": "https://thinksy-web.vercel.app/logo.png"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="ZeyFhGlDg_UN_jD-rxCQZyWs_52qgewqqIFRfGz7dJs" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-pink-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <LoginModal />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
