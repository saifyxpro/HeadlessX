module.exports = {
  apps: [{
    name: 'headlessx',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      TOKEN: process.env.TOKEN // REQUIRED: Set this in your environment
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || 3000,
      TOKEN: process.env.TOKEN // REQUIRED: Set this in your environment
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    autorestart: true
  }]
};
