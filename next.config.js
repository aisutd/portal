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
};

export default nextConfig;