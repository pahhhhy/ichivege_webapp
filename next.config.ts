
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
  },
  // publicRuntimeConfig is not needed in App Router
  // Use process.env.NEXT_PUBLIC_... directly for client-side vars
};

export default nextConfig;
