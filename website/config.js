// Environment configuration for HeadlessX website
// This file supports build-time environment variables for domain configuration

const config = {
  // Domain configuration from environment variables
  domain: process.env.NEXT_PUBLIC_DOMAIN,
  subdomain: process.env.NEXT_PUBLIC_SUBDOMAIN,
  
  // API configuration  
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  
  // Site metadata
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  
  // GitHub repository
  githubUrl: 'https://github.com/SaifyXPRO/HeadlessX',
  
  // App information
  version: '1.1.0',
  title: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
  description: 'Open-source browserless web scraping API with human-like behavior simulation'
};

module.exports = config;