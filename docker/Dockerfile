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
FROM mcr.microsoft.com/playwright:v1.56.0-noble

# Install essential system dependencies (removed nginx - not needed in container)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN if [ -f "package-lock.json" ]; then \
    npm ci --omit=dev; \
    else \
    npm install --production; \
    fi && npm cache clean --force

# Copy modular application source
COPY src/ ./src/

# Copy built website from previous stage
COPY --from=website-builder /app/website/out/ ./website/out/

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

# Expose the application port directly (no nginx proxy needed)
EXPOSE 3000

# Health check targets the Node.js application directly
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user for security
USER headlessx

# Start the Node.js application directly (no PM2 needed in container)
CMD ["node", "src/server.js"]
