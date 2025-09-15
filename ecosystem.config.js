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
      script: './src/server.js',
      cwd: process.cwd(), // Use current working directory
      
      // Process management
      instances: 1, // Start with 1 instance, can be scaled with: pm2 scale headlessx +1
      exec_mode: 'fork', // Use 'cluster' for CPU-intensive workloads
      
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Set to true for development, false for production
      max_memory_restart: '2G', // Restart if memory usage exceeds 2GB
      
      // Environment variables for production
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        
        // Security
        AUTH_TOKEN: 'your-secure-auth-token-here',
        
        // Browser configuration
        BROWSER_TIMEOUT: '60000',
        EXTRA_WAIT_TIME: '3000',
        MAX_CONCURRENCY: '3',
        
        // API configuration
        BODY_LIMIT: '10mb',
        MAX_BATCH_URLS: '10',
        
        // Website configuration
        WEBSITE_ENABLED: 'true',
        WEBSITE_PATH: './website/out',
        
        // Logging
        DEBUG: 'false',
        LOG_LEVEL: 'info'
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
      
      // Advanced PM2 features
      min_uptime: '10s', // Minimum uptime before considering a restart successful
      max_restarts: 10, // Maximum number of restarts within restart_delay period
      restart_delay: 4000, // Delay between restarts in milliseconds
      
      // Monitoring
      monitoring: false, // Set to true to enable PM2 Plus monitoring
      
      // Resource limits
      max_memory_restart: '2G',
      
      // Process signals
      kill_timeout: 5000, // Time to wait before force killing the process
      
      // Graceful shutdown
      listen_timeout: 3000,
      
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