#!/bin/bash

echo "=============================================="
echo "🚀 HEADLESSX INSTALLATION (Linux/Mac)"
echo "=============================================="

echo "[1/5] Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

echo "[2/5] Installing dependencies..."
pnpm install

echo "[3/5] Setting up Environment Variables..."
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please review .env and update your DATABASE_URL and API keys!"
else
    echo ".env already exists. Skipping copy."
fi

echo "[4/5] Downloading Camoufox resources (Stealth Browser)..."
pnpm run camoufox:fetch

echo "[5/5] Setting up Database (Prisma)..."
pnpm run db:push

echo "=============================================="
echo "✅ Installation Complete!"
echo "Run './scripts/start.sh' to launch HeadlessX."
echo "=============================================="
