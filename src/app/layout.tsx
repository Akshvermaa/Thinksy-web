import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContainer";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { LoginModal } from "@/components/LoginModal";

export const metadata: Metadata = {
  title: "Thinksy — Relatable Meme & Reel Ideas",
  description: "A community platform where users share short, relatable, meme/reel-worthy thoughts. No chats, no drama.",
  keywords: ["thinksy", "thoughts", "memes", "reels", "relatable", "quotes", "social platform"],
  verification: {
    google: "ZeyFhGlDg_UN_jD-rxCQZyWs_52qgewqqIFRfGz7dJs",
  },
  icons: {
    icon: "/logo.png",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="ZeyFhGlDg_UN_jD-rxCQZyWs_52qgewqqIFRfGz7dJs" />
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
