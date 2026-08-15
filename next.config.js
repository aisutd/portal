/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/', //hi
        destination: '/dashboard', 
        permanent: true,          
      },
    ]
  },
};

export default nextConfig;