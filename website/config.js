// Environment configuration for HeadlessX website
// This file supports build-time environment variables for domain configuration

const config = {
  // Domain configuration from environment variables or defaults
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'yourdomain.com',
  subdomain: process.env.NEXT_PUBLIC_SUBDOMAIN || 'your-subdomain',
  
  // API configuration  
  apiUrl: process.env.NEXT_PUBLIC_API_URL || `https://${process.env.NEXT_PUBLIC_SUBDOMAIN || 'your-subdomain'}.${process.env.NEXT_PUBLIC_DOMAIN || 'yourdomain.com'}`,
  
  // Site metadata
  siteUrl: `https://${process.env.NEXT_PUBLIC_SUBDOMAIN || 'your-subdomain'}.${process.env.NEXT_PUBLIC_DOMAIN || 'yourdomain.com'}`,
  
  // GitHub repository
  githubUrl: 'https://github.com/SaifyXPRO/HeadlessX',
  
  // App information
  version: '1.1.0',
  title: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
  description: 'Open-source browserless web scraping API with human-like behavior simulation'
};

module.exports = config;