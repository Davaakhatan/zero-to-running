/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  // Use 'standalone' for Docker, remove for Amplify
  ...(process.env.AMPLIFY !== 'true' && { output: 'standalone' }), // Enable standalone output for smaller Docker images
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
  // swcMinify is deprecated in Next.js 16, SWC is used by default
  
  typescript: {
    ignoreBuildErrors: false, // Don't ignore build errors in production
  },
  
  images: {
    unoptimized: false, // Enable image optimization
    formats: ['image/avif', 'image/webp'], // Modern image formats
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}

export default nextConfig
