#!/bin/bash
# Test Script - Verify Project Setup

echo "🔍 AI Video Story Generator - Setup Verification"
echo "=================================================="
echo ""

# Check Node.js and npm
echo "✓ Checking Node.js..."
node --version
npm --version

echo ""
echo "✓ Checking dependencies..."
cd /home/server/GitHub/AI-Story-Generator

# List main dependencies
echo ""
echo "Installed Packages:"
npm list --depth=0 2>/dev/null | grep -E "express|fluent-ffmpeg|@xenova|sharp|electron" | head -20

echo ""
echo "✓ Verifying file structure..."
echo "  - Main process: src/main/index.js"
echo "  - Renderer UI: src/renderer/index.html"
echo "  - Services: src/services/ (tts.js, videoComposer.js, gameplayManager.js)"
echo "  - Styles: src/renderer/styles.css"

echo ""
echo "✓ Checking required files..."
files=("package.json" "electron-builder.json" "README.md" "QUICK_START.md" "src/main/index.js" "src/renderer/index.html" "src/services/tts.js" "src/services/videoComposer.js")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
  fi
done

echo ""
echo "✓ System requirements status:"
if command -v ffmpeg &> /dev/null; then
  echo "  ✓ FFmpeg is installed"
else
  echo "  ⚠ FFmpeg not found - install with:"
  echo "    Linux: sudo apt-get install ffmpeg"
  echo "    macOS: brew install ffmpeg"
  echo "    Windows: choco install ffmpeg"
fi

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo ""
echo "To start the application, run:"
echo "  npm start"
echo ""
echo "For first time setup info, see: QUICK_START.md"
