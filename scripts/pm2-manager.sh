#!/bin/bash

# PM2 Management Script for HeadlessX
# Compatible with all PM2 versions
# Use this instead of direct PM2 commands

APP_NAME="headlessx"
SCRIPT_PATH="src/server.js"

case "$1" in
    start)
        echo "🚀 Starting HeadlessX with PM2..."
        pm2 start $SCRIPT_PATH --name $APP_NAME --time --update-env --max-memory-restart 800M
        pm2 save
        ;;
    stop)
        echo "🛑 Stopping HeadlessX..."
        pm2 stop $APP_NAME
        ;;
    restart)
        echo "🔄 Restarting HeadlessX..."
        pm2 restart $APP_NAME --update-env
        ;;
    reload)
        echo "🔄 Reloading HeadlessX..."
        pm2 reload $APP_NAME
        ;;
    delete)
        echo "🗑️ Deleting HeadlessX from PM2..."
        pm2 delete $APP_NAME
        ;;
    status)
        echo "📊 HeadlessX Status:"
        pm2 status $APP_NAME
        ;;
    logs)
        echo "📝 HeadlessX Logs:"
        pm2 logs $APP_NAME
        ;;
    logs-error)
        echo "❌ HeadlessX Error Logs:"
        pm2 logs $APP_NAME --err
        ;;
    monit)
        echo "📈 Opening PM2 Monitor..."
        pm2 monit
        ;;
    info)
        echo "ℹ️ HeadlessX Process Info:"
        pm2 describe $APP_NAME
        ;;
    reset)
        echo "🔄 Resetting HeadlessX (stop, delete, start)..."
        pm2 stop $APP_NAME 2>/dev/null || true
        pm2 delete $APP_NAME 2>/dev/null || true
        pm2 start $SCRIPT_PATH --name $APP_NAME --time --update-env --max-memory-restart 800M
        pm2 save
        ;;
    *)
        echo "HeadlessX PM2 Management Script"
        echo "Usage: $0 {start|stop|restart|reload|delete|status|logs|logs-error|monit|info|reset}"
        echo ""
        echo "Commands:"
        echo "  start       - Start HeadlessX"
        echo "  stop        - Stop HeadlessX" 
        echo "  restart     - Restart HeadlessX"
        echo "  reload      - Reload HeadlessX (zero-downtime)"
        echo "  delete      - Remove HeadlessX from PM2"
        echo "  status      - Show HeadlessX status"
        echo "  logs        - Show HeadlessX logs"
        echo "  logs-error  - Show HeadlessX error logs only"
        echo "  monit       - Open PM2 monitor"
        echo "  info        - Show detailed process info"
        echo "  reset       - Reset HeadlessX (stop, delete, start)"
        exit 1
        ;;
esac