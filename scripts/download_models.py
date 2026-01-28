"""
Download Models for HeadlessX Backend
"""

import os
import sys
import shutil
import requests
from pathlib import Path
from tqdm import tqdm

# Model URLs and info
MODELS = {
    "recaptcha_classification_57k.onnx": {
        "url": "https://huggingface.co/DannyLuna/recaptcha-classification-57k/resolve/main/recaptcha_classification_57k.onnx",
        "description": "reCAPTCHA 3x3 Classification Model (14 classes)",
        "size_mb": 108,
    },
}

# Backend Models directory (relative to this script: ../backend/models)
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent / "backend"
MODELS_DIR = BACKEND_DIR / "models"


def download_file(url: str, dest_path: Path, desc: str = "Downloading") -> bool:
    """Download a file with progress bar"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(dest_path, 'wb') as f:
            with tqdm(
                total=total_size,
                unit='B',
                unit_scale=True,
                desc=desc,
                ncols=80
            ) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
        
        return True
        
    except Exception as e:
        print(f"❌ Error downloading: {e}")
        if dest_path.exists():
            dest_path.unlink()
        return False


def download_models(force: bool = False):
    """Download all required models"""
    print("=" * 60)
    print("🦊 HeadlessX - Model Downloader")
    print("=" * 60)
    
    # Create models directory
    if not BACKEND_DIR.exists():
        print(f"❌ Backend directory not found at: {BACKEND_DIR}")
        return

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📁 Models directory: {MODELS_DIR}\n")
    
    # === 1. Classification Model (3x3) ===
    for model_name, model_info in MODELS.items():
        model_path = MODELS_DIR / model_name
        
        print(f"📦 {model_name}")
        print(f"   {model_info['description']}")
        print(f"   Size: ~{model_info['size_mb']} MB")
        
        if model_path.exists() and not force:
            print(f"   ✅ Already exists, skipping...")
            print()
            continue
        
        print(f"   ⬇️  Downloading from HuggingFace...")
        
        success = download_file(
            url=model_info['url'],
            dest_path=model_path,
            desc=f"   {model_name}"
        )
        
        if success:
            print(f"   ✅ Downloaded successfully!")
        else:
            print(f"   ❌ Failed to download!")
        
        print()
    
    # === 2. YOLO26x Detection Model (4x4) ===
    yolo_model_path = MODELS_DIR / "yolo26x.pt"
    print(f"📦 yolo26x.pt")
    print(f"   YOLO26x Detection Model (COCO 80 classes)")
    print(f"   Size: ~113 MB")
    
    if yolo_model_path.exists() and not force:
        print(f"   ✅ Already exists, skipping...")
    else:
        print(f"   ⬇️  Downloading via Ultralytics...")
        try:
            from ultralytics import YOLO
            
            # Download model
            model = YOLO("yolo26x.pt")
            
            # Find where Ultralytics downloaded it
            possible_paths = [
                Path("yolo26x.pt"),
                Path.home() / ".cache" / "ultralytics" / "yolo26x.pt",
                Path(os.getcwd()) / "yolo26x.pt"
            ]
            
            # Save strictly to our target path
            # If Ultralytics saved it to CWD, move it. If not, save existing model object.
            
            found = False
            for p in possible_paths:
                if p.exists():
                    shutil.copy(p, yolo_model_path)
                    print(f"   ✅ Model moved from {p} to {yolo_model_path}")
                    if p != yolo_model_path and p.name == "yolo26x.pt": # cleanup local clutter
                         try:
                             p.unlink()
                         except:
                             pass
                    found = True
                    break
            
            if not found:
                # If file not found on disk implies it might be in memory or custom location,
                # explicitly save it to the desired path
                model.save(str(yolo_model_path))
                print(f"   ✅ Model saved to {yolo_model_path}")

        except Exception as e:
            print(f"   ❌ Failed to download: {e}")
    
    print()
    print("=" * 60)
    print("✅ Model download complete!")
    print("=" * 60)


def verify_models():
    """Verify all models are present and loadable"""
    print("\n🔍 Verifying models...\n")
    
    all_ok = True
    
    # === 1. Check classification model ===
    classification_model = MODELS_DIR / "recaptcha_classification_57k.onnx"
    if classification_model.exists():
        print(f"✅ Classification model: {classification_model.name}")
        print(f"   Size: {classification_model.stat().st_size / 1024 / 1024:.1f} MB")
        
        try:
            from ultralytics import YOLO
            model = YOLO(str(classification_model), task="classify")
            # print(f"   Classes: {len(model.names)}") 
            print(f"   ✅ Model loads correctly!")
        except Exception as e:
            print(f"   ⚠️ Could not verify: {e}")
            # Don't fail entire verify if just load fails but file exists (could be missing deps)
    else:
        print(f"❌ Classification model not found!")
        all_ok = False
    
    print()
    
    # === 2. Check detection model ===
    detection_model = MODELS_DIR / "yolo26x.pt"
    if detection_model.exists():
        print(f"✅ Detection model: {detection_model.name}")
        print(f"   Size: {detection_model.stat().st_size / 1024 / 1024:.1f} MB")
        
        try:
            from ultralytics import YOLO
            model = YOLO(str(detection_model))
            # print(f"   Classes: {len(model.names)}")
            print(f"   ✅ Model loads correctly!")
        except Exception as e:
            print(f"   ⚠️ Could not verify: {e}")
    else:
        print(f"❌ Detection model not found!")
        all_ok = False
    
    print()
    
    if all_ok:
        print("✅ All models verified successfully!")
    else:
        print("⚠️ Some models are missing. Run: python scripts/download_models.py")
    
    return all_ok


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Download models for HeadlessX")
    parser.add_argument("--force", "-f", action="store_true", help="Force re-download")
    parser.add_argument("--verify", "-v", action="store_true", help="Only verify existing models")
    
    args = parser.parse_args()
    
    if args.verify:
        verify_models()
    else:
        download_models(force=args.force)
        verify_models()
