/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Fix TLS negotiation issues on some networks/ISPs
  env: {
    NODE_TLS_REJECT_UNAUTHORIZED: "0",
  },
};

module.exports = nextConfig;
