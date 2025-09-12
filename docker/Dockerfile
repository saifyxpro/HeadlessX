# HeadlessX v1.1.0 - Unified Web Scraping API with Website
# Multi-stage build for optimized production image

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
FROM mcr.microsoft.com/playwright:v1.40.0-focal

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
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY src/ ./src/
COPY config/ ./config/

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
ENV TOKEN=""
ENV DOMAIN=localhost
ENV SUBDOMAIN=headlessx

# Create startup script for unified architecture
RUN echo '#!/bin/bash\n\
# Configure nginx to proxy to Node.js\n\
sed -i "s/SUBDOMAIN.DOMAIN.COM/$SUBDOMAIN.$DOMAIN/g" /etc/nginx/sites-available/default\n\
service nginx start\n\
\n\
# Start HeadlessX unified server\n\
exec su headlessx -c "node src/server.js"' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Health check for unified server
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1

# Start unified server with nginx proxy
CMD ["/start.sh"]
