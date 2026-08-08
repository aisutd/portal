/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard', // The page you want as your new starting route
        permanent: true,          // Use true for a 308 permanent redirect
      },
    ]
  },
};

export default nextConfig;