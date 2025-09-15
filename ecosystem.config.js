/**
 * PM2 Ecosystem Configuration for HeadlessX v1.2.0
 * 
 * This configuration file manages HeadlessX deployment with PM2
 * providing process management, monitoring, and scaling capabilities
 * 
 * All values are loaded from .env file - no hardcoded values
 */

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  apps: [
    {
      // Application configuration
      name: 'headlessx',
      script: './src/server.js', // Main server entry point
      cwd: process.cwd(),
      
      // Process management
      instances: 1, // Start with 1 instance, can be scaled with: pm2 scale headlessx +1
      exec_mode: 'fork', // Use 'cluster' for CPU-intensive workloads
      
      // Auto-restart configuration - REDUCED FOR STABILITY
      autorestart: true,
      watch: false, // Set to true for development, false for production
      max_memory_restart: '800M', // Restart if memory usage exceeds 800MB (conservative for 2GB server)
      
      // Startup configuration for better reliability - CONSERVATIVE
      min_uptime: '30s', // Minimum uptime before restart (increased)
      max_restarts: 3, // Maximum restarts in 1 minute (reduced)
      restart_delay: 5000, // Delay between restarts (5 seconds - increased)
      
      // Environment variables for production - ALL FROM .env FILE
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || '0.0.0.0',
        
        // Security - FROM .env FILE
        AUTH_TOKEN: process.env.AUTH_TOKEN,
        
        // Domain configuration - FROM .env FILE
        DOMAIN: process.env.DOMAIN,
        SUBDOMAIN: process.env.SUBDOMAIN,
        
        // Website environment variables - FROM .env FILE
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NEXT_PUBLIC_SUBDOMAIN: process.env.NEXT_PUBLIC_SUBDOMAIN,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        
        // Browser configuration - FROM .env FILE
        BROWSER_TIMEOUT: process.env.BROWSER_TIMEOUT || '30000',
        EXTRA_WAIT_TIME: process.env.EXTRA_WAIT_TIME || '2000',
        MAX_CONCURRENCY: process.env.MAX_CONCURRENCY || '2',
        
        // API configuration - FROM .env FILE
        BODY_LIMIT: process.env.BODY_LIMIT || '5mb',
        MAX_BATCH_URLS: process.env.MAX_BATCH_URLS || '5',
        
        // Website configuration - FROM .env FILE
        WEBSITE_ENABLED: process.env.WEBSITE_ENABLED || 'true',
        WEBSITE_PATH: process.env.WEBSITE_PATH || './website/out',
        
        // Logging - FROM .env FILE
        DEBUG: process.env.DEBUG || 'false',
        LOG_LEVEL: process.env.LOG_LEVEL || 'error'
      },
      
      // Environment variables for development - FROM .env FILE
      env_development: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || 'localhost',
        AUTH_TOKEN: process.env.AUTH_TOKEN,
        DOMAIN: process.env.DOMAIN,
        SUBDOMAIN: process.env.SUBDOMAIN,
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NEXT_PUBLIC_SUBDOMAIN: process.env.NEXT_PUBLIC_SUBDOMAIN,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        DEBUG: 'true',
        LOG_LEVEL: 'debug',
        BROWSER_TIMEOUT: process.env.BROWSER_TIMEOUT || '30000',
        EXTRA_WAIT_TIME: process.env.EXTRA_WAIT_TIME || '2000',
        MAX_CONCURRENCY: process.env.MAX_CONCURRENCY || '2'
      },
      
      // Environment variables for staging - FROM .env FILE
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || '0.0.0.0',
        AUTH_TOKEN: process.env.AUTH_TOKEN,
        DOMAIN: process.env.DOMAIN,
        SUBDOMAIN: process.env.SUBDOMAIN,
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NEXT_PUBLIC_SUBDOMAIN: process.env.NEXT_PUBLIC_SUBDOMAIN,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        DEBUG: 'true',
        LOG_LEVEL: 'debug'
      },
      
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 features - CONSERVATIVE SETTINGS
      min_uptime: '30s', // Minimum uptime before considering a restart successful
      max_restarts: 3, // Maximum number of restarts within restart_delay period (reduced)
      restart_delay: 10000, // Delay between restarts in milliseconds (increased to 10s)
      
      // Monitoring
      monitoring: false, // Set to true to enable PM2 Plus monitoring
      
      // Resource limits - CONSERVATIVE FOR 2GB RAM
      max_memory_restart: '800M', // Conservative memory limit
      
      // Process signals - EXTENDED TIMEOUTS
      kill_timeout: 10000, // Time to wait before force killing the process (increased)
      
      // Graceful shutdown - EXTENDED TIMEOUTS
      listen_timeout: 8000, // Increased timeout for server startup
      
      // Health check (if using PM2 Plus)
      health_check_path: '/api/health',
      health_check_grace_period: 3000
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/HeadlessX.git',
      path: '/var/www/headlessx',
      'post-deploy': 'npm install && npm run build:website && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/HeadlessX.git',
      path: '/var/www/headlessx-staging',
      'post-deploy': 'npm install && npm run build:website && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};