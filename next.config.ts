
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
    lineLoginChannelId: process.env.LINE_LOGIN_CHANNEL_ID,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    lineLoginChannelId: process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID,
  },
};

export default nextConfig;
