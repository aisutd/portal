/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.portal.aisutd.org', 
        port: '',
        pathname: '/**'
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb', // higher than actual limit to let server handle errors
    },
  },
};

export default nextConfig;