/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Next.js 14 syntax for excluding packages from server bundle
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist", "pdf-parse"],
  },
};

module.exports = nextConfig;
