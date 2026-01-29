@echo off
setlocal
echo ==========================================
echo    HeadlessX Model Installer
echo ==========================================

echo.
echo [1/2] Installing Python prerequisites...
pip install requests tqdm ultralytics
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install Python dependencies. Ensure python and pip are in your PATH.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Downloading Models...
python scripts/download_models.py
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Model download failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ Installation Complete!
echo    Models are located in: backend/models
pause
