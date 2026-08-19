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
    default: "Astra Intelligence — The AI Marketing OS",
    template: "%s | Astra Intelligence",
  },
  description:
    "Your autonomous AI marketing team. Brand Brain, 4-agent pipeline, campaign builder, auto-publish to LinkedIn & Twitter. Powered by Claude 3.5 on Amazon Bedrock.",
  keywords: [
    "AI marketing", "marketing automation", "content generation", "social media AI",
    "Claude AI", "brand brain", "campaign builder", "marketing OS", "AI agents",
  ],
  authors: [{ name: "Astra Intelligence" }],
  creator: "Astra Intelligence",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://astraweb-production.up.railway.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Astra Intelligence",
    title: "Astra Intelligence — The AI Marketing OS",
    description: "Your autonomous AI marketing team. Brand Brain, 4-agent pipeline, campaign builder, auto-publish to LinkedIn & Twitter.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astra Intelligence — The AI Marketing OS",
    description: "Your autonomous AI marketing team. Brand Brain, 4-agent pipeline, campaign builder.",
    creator: "@AstraIntelWorld",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
