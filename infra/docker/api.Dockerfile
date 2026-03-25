FROM node:22-slim AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HEADFOX_JS_RELEASE_REPO="daijro/camoufox"
ENV HEADFOX_JS_RELEASE_TAG="v135.0.1-beta.24"
RUN corepack enable

# Install required dependencies for Camoufox/Playwright
RUN apt-get update && apt-get install -y \
    build-essential \
    xvfb \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libcups2 \
    libdrm2 \
    libx11-xcb1 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json ./

# Copy API app
COPY apps/api ./apps/api
COPY infra/docker/api-entrypoint.sh /usr/local/bin/headlessx-api-entrypoint
COPY infra/docker/worker-entrypoint.sh /usr/local/bin/headlessx-worker-entrypoint

# Install dependencies
RUN pnpm install --frozen-lockfile
RUN pnpm rebuild better-sqlite3

# Generate Prisma Client and fetch the managed browser bundle
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm exec headfox-js fetch

# Build the API
WORKDIR /app
RUN pnpm exec nx run headlessx-api:build

# Start the API
WORKDIR /app/apps/api
RUN chmod +x /usr/local/bin/headlessx-api-entrypoint /usr/local/bin/headlessx-worker-entrypoint
CMD ["/usr/local/bin/headlessx-api-entrypoint"]
