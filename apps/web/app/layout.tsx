import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Astra Intelligence",
    template: "%s | Astra Intelligence",
  },
  description:
    "Your autonomous AI Chief Marketing Officer. Strategy, content, publishing, and analytics — all in one intelligent platform.",
  keywords: ["AI marketing", "content generation", "social media automation", "marketing intelligence"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://astra-intelligence.com",
    siteName: "Astra Intelligence",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
