import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

// The home page is a client-only dynamic import (the 3D viewer, ssr: false),
// so the first text that actually uses this font paints after the heavy viewer
// JS hydrates. Eagerly preloading the woff2 therefore triggers the browser
// "preloaded but not used within a few seconds" warning without any benefit.
// Disable preload and use `swap` so text renders immediately with a fallback
// and upgrades to Inter once it loads.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "AEC Digital Twin",
    template: "%s | AEC Digital Twin",
  },
  description:
    "Open-source browser-based AEC digital twin platform powered by IFC, Fragments, and That Open Company libraries.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
