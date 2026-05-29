# AI Video Story Generator - Quick Start Guide 🚀

## ✅ What's Been Built

Your AI-Video-Story-Gen project is **fully set up and ready to run**!

### Project Structure

```
AI-Story-Generator/
├── src/
│   ├── main/
│   │   ├── index.js          ← Electron main process (app lifecycle)
│   │   └── preload.js        ← IPC bridge (secure communication)
│   ├── renderer/
│   │   ├── index.html        ← UI layout
│   │   ├── styles.css        ← Styling (gradient, responsive design)
│   │   └── app.js            ← UI interactivity & workflow
│   └── services/
│       ├── tts.js            ← HuggingFace TTS (text → audio)
│       ├── videoComposer.js  ← FFmpeg pipeline (audio + video)
│       └── gameplayManager.js← Gameplay library management
├── package.json              ← Dependencies & build config
├── electron-builder.json     ← Installer config
└── README.md & CONFIG.md     ← Documentation
```

### Tech Stack Installed

- **Electron** - Desktop application framework
- **@xenova/transformers** - HuggingFace TTS models
- **fluent-ffmpeg** - FFmpeg wrapper for video
- **Express.js** - Lightweight server (if needed)
- **Node.js v20** - Runtime environment

---

## 🛠️ Prerequisites (One-Time Setup)

Before running the app, **install FFmpeg** (required for video processing):

### Linux (Ubuntu/Debian):
```bash
sudo apt-get install ffmpeg
```

### macOS (with Homebrew):
```bash
brew install ffmpeg
```

### Windows (with Chocolatey):
```bash
choco install ffmpeg
```

### Verify FFmpeg is installed:
```bash
ffmpeg -version
```

---

## 🎬 Running the App

### Start the Application:
```bash
cd /home/server/GitHub/AI-Story-Generator
npm start
```

This will:
1. Launch the Electron app window
2. Display the UI with story input, gameplay selector, and video output controls
3. Open DevTools for debugging

### First Run (Important!)

**On first launch:**
- The app will download HuggingFace TTS model (~500MB)
- This takes 5-15 minutes depending on internet speed
- Model is cached locally, so future runs are much faster
- Downloads go to: `~/.cache/huggingface/`

---

## 📝 How to Use the App

### 1. **Enter Story** (Input Panel)
   - Click the text area and type/paste your story
   - Max 1000 characters for best results
   - Example: "A brave knight enters a dark castle seeking treasure..."

### 2. **Select Gameplay** (Input Panel)
   - Click "Choose Gameplay Clip (.mp4)"
   - Select a pre-recorded video (.mp4 file)
   - Supports Subway Surfers, Minecraft parkour, etc.
   - Recommended: landscape or portrait format

### 3. **Configure Video** (Output Panel)
   - Set duration (15-90 seconds for Instagram Reels)
   - Choose TTS voice (default, male, female)
   - Enable/disable text captions
   - Set output filename

### 4. **Generate Video**
   - Click "✨ Generate Video"
   - App will:
     1. Convert story text → TTS audio (WAV)
     2. Compose video: gameplay + audio overlay
     3. Scale to 1080x1920 (Instagram Reels format)
     4. Export as H.264/AAC MP4
   - Progress bar shows process status

### 5. **Export**
   - Click "💾 Export to Output Folder"
   - Choose destination folder
   - Video is saved as `.mp4` file

### Generated Files Location

- **Audio files**: `~/.ai-video-story-gen/audio/`
- **Video files**: `~/.ai-video-story-gen/videos/`
- **Gameplay library**: `~/.ai-video-story-gen/gameplay/`

---

## 🎯 Workflow Example

```
User Story Input
        ↓
    "Once upon a time, a hero emerged..."
        ↓
    TTS Conversion (HuggingFace)
        ↓
    Audio: narration_12345.wav (10 seconds)
        ↓
    Video Composition (FFmpeg)
        ↓
    Input: gameplay.mp4 + narration.wav
        ↓
    Output: 1080x1920, H.264/AAC, 30fps
        ↓
    Instagram-Ready MP4 ✅
        ↓
    Upload to Instagram Reels!
```

---

## ⚙️ Troubleshooting

### Issue: "FFmpeg not found"
**Solution:**
- Verify FFmpeg is installed: `ffmpeg -version`
- Add FFmpeg to PATH or specify custom location in environment

### Issue: "Slow on first launch"
**Solution:**
- First run downloads models (~500MB) - this is normal
- Subsequent runs will be faster (models cached)
- You can see progress in console

### Issue: "Out of memory errors"
**Solution:**
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

### Issue: "Video quality issues"
**Solution:**
- Ensure gameplay video is high quality (720p+)
- Try different gameplay files
- Check output format: must be 9:16 aspect ratio

### Issue: "Audio not syncing"
**Solution:**
- Verify audio duration matches video duration
- Check that audio file is valid WAV format
- Try shortening the story text

---

## 📚 Development

### View Logs:
The app opens DevTools console by default. You can see:
- TTS model loading progress
- FFmpeg processing steps
- Error messages and warnings

### Edit UI:
- **Layout**: `src/renderer/index.html`
- **Styling**: `src/renderer/styles.css`
- **Logic**: `src/renderer/app.js`

### Edit Services:
- **TTS**: `src/services/tts.js` - Change model, voices, etc.
- **Video**: `src/services/videoComposer.js` - Adjust resolution, bitrate, filters
- **Gameplay**: `src/services/gameplayManager.js` - Library management

### Modify App Behavior:
- **Main Process**: `src/main/index.js` - Add new IPC handlers
- **IPC Bridge**: `src/renderer/preload.js` - Expose new functions to UI

---

## 🔧 Configuration

### Environment Variables:
```bash
# Increase memory for large models
export NODE_OPTIONS="--max-old-space-size=8192"

# Custom FFmpeg path
export FFMPEG_PATH="/usr/bin/ffmpeg"

# Debugging
export DEBUG="*"
```

### Instagram Reels Specs (Verified ✓)
- **Resolution**: 1080 × 1920 pixels (9:16 aspect ratio)
- **Duration**: 15-90 seconds
- **Frame rate**: 30fps
- **Video codec**: H.264
- **Audio codec**: AAC (128kbps, stereo)
- **Container**: MP4
- **Max file size**: ~100MB

---

## 🚀 Building for Distribution

### Create Standalone Installers:
```bash
npm run dist
```

This creates:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage` and `.deb` packages

---

## 📝 Next Steps

### To Add Features:
1. **Real-time gameplay capture** - Use Puppeteer/screen recording
2. **Batch video generation** - Queue system for multiple videos
3. **Video effects** - Add transitions, filters, overlays
4. **Custom music** - Blend background music with narration
5. **Multi-language support** - Support different TTS languages
6. **Cloud export** - Direct upload to Instagram

---

## 📞 Support

For issues or questions, check:
- `README.md` - Feature overview
- `CONFIG.md` - Environment setup
- DevTools Console - Error messages
- FFmpeg documentation - Video processing questions

---

## ✨ Happy Creating!

You now have a fully functional AI-powered video story generator. Start creating engaging Instagram content! 🎬

**Quick command:**
```bash
cd /home/server/GitHub/AI-Story-Generator && npm start
```

---

**Project Status**: ✅ Ready for use (v0.1.0)
