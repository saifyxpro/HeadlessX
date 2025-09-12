/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: '',
  distDir: 'out',
  
  // Environment variables for build-time configuration
  env: {
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN,
    NEXT_PUBLIC_SUBDOMAIN: process.env.NEXT_PUBLIC_SUBDOMAIN || process.env.SUBDOMAIN,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Generate static paths with environment-based configuration
  generateBuildId: async () => {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || 'yourdomain.com';
    const subdomain = process.env.NEXT_PUBLIC_SUBDOMAIN || process.env.SUBDOMAIN || 'your-subdomain';
    return `headlessx-${subdomain}-${Date.now()}`;
  }
}

module.exports = nextConfig