@echo off
echo ==============================================
echo 🚀 HEADLESSX INSTALLATION (Windows)
echo ==============================================

echo [1/5] Checking for pnpm...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo pnpm not found. Installing pnpm...
    npm install -g pnpm
)

echo [2/5] Installing dependencies...
call pnpm install

echo [3/5] Setting up Environment Variables...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please review .env and update your DATABASE_URL and API keys!
) else (
    echo .env already exists. Skipping copy.
)

echo [4/5] Downloading Camoufox resources (Stealth Browser)...
call pnpm run camoufox:fetch

echo [5/5] Setting up Database (Prisma)...
call pnpm run db:push

echo ==============================================
echo ✅ Installation Complete!
echo Run 'scripts\start.bat' to launch HeadlessX.
echo ==============================================
pause
