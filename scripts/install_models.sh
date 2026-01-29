#!/bin/bash

echo "=========================================="
echo "   HeadlessX Model Installer"
echo "=========================================="

echo ""
echo "[1/2] Installing Python prerequisites..."
pip install requests tqdm ultralytics

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies. Ensure python and pip are in your PATH."
    exit 1
fi

echo ""
echo "[2/2] Downloading Models..."
python3 scripts/download_models.py || python scripts/download_models.py

if [ $? -ne 0 ]; then
    echo "❌ Model download failed."
    exit 1
fi

echo ""
echo "✅ Installation Complete!"
echo "   Models are located in: backend/models"
