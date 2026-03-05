/** @type {import('next').NextConfig} */
const nextConfig = {
  // No usar output: 'export' — incompatible con Supabase SSR y middleware
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
