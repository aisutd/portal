/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-a3cb7d30ea044503a67b8b9350b3817b.r2.dev', // Allows standard Cloudflare R2 public URLs
        port: '',
        pathname: '/**'
      },
      // If using a custom domain (e.g. assets.yourdomain.com):
      // {
      //   protocol: 'https',
      //   hostname: 'assets.yourdomain.com',
      // },
    ],
  },
};

export default nextConfig;