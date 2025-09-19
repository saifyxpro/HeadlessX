# HeadlessX v1.2.0 - Modular Browserless Web Scraping API
# Multi-stage build for optimized production image with modular architecture

# Stage 1: Build website
FROM node:20-slim AS website-builder

WORKDIR /app/website

# Copy website package files
COPY website/package*.json ./

# Install website dependencies
RUN npm ci

# Copy website source
COPY website/ ./

# Build website for production
RUN npm run build

# Stage 2: Production runtime
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
# If package-lock.json exists, use npm ci, otherwise use npm install
RUN if [ -f "package-lock.json" ]; then \
        npm ci --only=production; \
    else \
        npm install --production; \
    fi && npm cache clean --force

# Copy modular application source
COPY src/ ./src/

# Copy PM2 ecosystem configuration (now in root)
COPY ecosystem.config.js ./

# Copy built website from previous stage
COPY --from=website-builder /app/website/out/ ./website/out/

# Copy nginx configuration for unified architecture
COPY nginx/headlessx.conf /etc/nginx/sites-available/default

# Create logs directory
RUN mkdir -p logs

# Create non-root user for security
RUN groupadd -r headlessx && useradd -r -g headlessx headlessx
RUN chown -R headlessx:headlessx /app

# Environment variables (override with docker-compose or runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV AUTH_TOKEN=""
ENV DOMAIN=localhost
ENV SUBDOMAIN=headlessx

# Create startup script for simplified server architecture
RUN echo '#!/bin/bash\n\
# Configure nginx to proxy to Node.js\n\
sed -i "s/SUBDOMAIN.DOMAIN.COM/$SUBDOMAIN.$DOMAIN/g" /etc/nginx/sites-available/default\n\
service nginx start\n\
\n\
# Start HeadlessX server\n\
exec su headlessx -c "node src/server.js"' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Health check for modular server
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1

# Start modular server with nginx proxy
CMD ["/start.sh"]
