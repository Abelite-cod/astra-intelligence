/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Prevent webpack from bundling these — use native Node.js require()
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

module.exports = nextConfig;
