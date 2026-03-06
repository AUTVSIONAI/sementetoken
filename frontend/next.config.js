/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true, // Em produção com standalone e docker, às vezes image optimization falha sem configuração extra
  },
  async rewrites() {
    console.log('API_URL from environment:', process.env.API_URL);
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || 'http://backend:3000'}/api/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_URL || 'http://backend:3000'}/uploads/:path*`
      },
    ]
  },
}

module.exports = nextConfig
