#!/bin/bash

echo "=============================================="
echo "🚀 HEADLESSX INSTALLATION (Linux/Mac)"
echo "=============================================="

echo "[1/5] Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

echo "[2/5] Setting up Environment Variables..."
if [ ! -f backend/.env ]; then
    if [ -f .env.example ]; then
        echo "Creating backend/.env from .env.example..."
        cp .env.example backend/.env
        echo ""
        echo "⚠️  IMPORTANT: Edit backend/.env and set your DATABASE_URL!"
        echo "    - Supabase: Get connection string from Dashboard -> Settings -> Database"
        echo "    - Self-hosted: postgresql://user:password@host:5432/database"
        echo ""
        read -p "Press Enter after configuring backend/.env..."
    else
        echo "❌ .env.example not found! Please create backend/.env manually."
        exit 1
    fi
else
    echo "backend/.env already exists. Skipping copy."
fi

echo "[3/5] Installing dependencies..."
pnpm install

echo "[4/5] Downloading Camoufox resources (Stealth Browser)..."
pnpm run camoufox:fetch

echo "[5/5] Setting up Database (Prisma)..."
if ! pnpm run db:push; then
    echo "⚠️  Database setup failed. Check your DATABASE_URL in backend/.env"
    exit 1
fi

echo "=============================================="
echo "✅ Installation Complete!"
echo "Run './scripts/start.sh' to launch HeadlessX."
echo "=============================================="
