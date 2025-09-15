/**
 * PM2 Ecosystem Configuration for HeadlessX v1.2.0
 * 
 * This configuration file manages HeadlessX deployment with PM2
 * providing process management, monitoring, and scaling capabilities
 */

module.exports = {
  apps: [
    {
      // Application configuration
      name: 'headlessx',
      script: './src/server.js', // Using main app for debugging
      cwd: process.cwd(), // Use current working directory
      
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
      
      // Environment variables for production
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        
        // Security
        AUTH_TOKEN: 'headless-x-secure-token-2024',
        
        // Browser configuration - OPTIMIZED FOR 2GB RAM
        BROWSER_TIMEOUT: '30000',      // Reduced from 60000
        EXTRA_WAIT_TIME: '2000',       // Reduced from 3000 
        MAX_CONCURRENCY: '2',          // Reduced from 3
        
        // API configuration - LIGHTWEIGHT
        BODY_LIMIT: '5mb',             // Reduced from 10mb
        MAX_BATCH_URLS: '5',           // Reduced from 10
        
        // Website configuration
        WEBSITE_ENABLED: 'true',
        WEBSITE_PATH: './website/out',
        
        // Logging - MINIMAL
        DEBUG: 'false',
        LOG_LEVEL: 'error'             // Only errors to reduce overhead
      },
      
      // Environment variables for development
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: 'localhost',
        DEBUG: 'true',
        LOG_LEVEL: 'debug',
        BROWSER_TIMEOUT: '30000',
        EXTRA_WAIT_TIME: '2000',
        MAX_CONCURRENCY: '2'
      },
      
      // Environment variables for staging
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        HOST: '0.0.0.0',
        AUTH_TOKEN: 'staging-auth-token',
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