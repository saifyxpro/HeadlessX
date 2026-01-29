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

echo [2/5] Setting up Environment Variables...
if not exist backend\.env (
    if exist .env.example (
        echo Creating backend\.env from .env.example...
        copy .env.example backend\.env
        echo.
        echo ⚠️  IMPORTANT: Edit backend\.env and set your DATABASE_URL!
        echo     - Supabase: Get connection string from Dashboard -^> Settings -^> Database
        echo     - Self-hosted: postgresql://user:password@host:5432/database
        echo.
        echo Press any key after configuring backend\.env...
        pause >nul
    ) else (
        echo ❌ .env.example not found! Please create backend\.env manually.
        pause
        exit /b 1
    )
) else (
    echo backend\.env already exists. Skipping copy.
)

echo [3/5] Installing dependencies...
call pnpm install

echo [4/5] Downloading Camoufox resources (Stealth Browser)...
call pnpm run camoufox:fetch

echo [5/5] Setting up Database (Prisma)...
call pnpm run db:push
if %errorlevel% neq 0 (
    echo ⚠️  Database setup failed. Check your DATABASE_URL in backend\.env
    pause
    exit /b 1
)

echo ==============================================
echo ✅ Installation Complete!
echo Run 'scripts\start.bat' to launch HeadlessX.
echo ==============================================
pause
