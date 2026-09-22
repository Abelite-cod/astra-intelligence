import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

// geist package not installed — DM Sans is the approved fallback (see DESIGN_AUDIT.md §3.3)
// Both are mapped to the --font-geist-sans / --font-geist-mono CSS variable names so that
// tailwind.config.ts `fontFamily.sans: ["var(--font-geist-sans)", ...]` resolves correctly.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["300", "400", "500"],
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
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
