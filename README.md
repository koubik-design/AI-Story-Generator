# AI Video Story Generator

Create stunning Instagram Reels with AI-generated narration and gameplay overlay.

## Features

✨ **AI Narration** - Convert story text to natural-sounding speech using HuggingFace TTS
🎮 **Gameplay Overlay** - Combine with pre-recorded gameplay videos (Subway Surfers, Minecraft parkour, etc.)
📱 **Instagram Optimized** - Automatically formats for Instagram Reels (9:16 aspect ratio, 1080x1920px)
🎬 **Video Composition** - Seamlessly blend audio and video with professional-quality encoding
💻 **Desktop App** - Cross-platform support (Windows, macOS, Linux)

## Installation

### Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **FFmpeg** - Required for video processing
  - **Windows**: `choco install ffmpeg` (using Chocolatey)
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt-get install ffmpeg`

### Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd AI-Story-Generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install FFmpeg (if not already installed):
   - See instructions above for your OS

4. Start the application:
   ```bash
   npm start
   ```

## Usage

1. **Enter Story**: Write or paste your story text in the input panel (max 1000 characters)
2. **Select Gameplay**: Choose a pre-recorded gameplay video (.mp4)
3. **Configure**: Set duration (15-90 seconds) and other options
4. **Generate**: Click "Generate Video" to create your video
5. **Export**: Export the finished video to your desired location

## How It Works

1. **Text-to-Speech**: Your story is converted to audio using HuggingFace's TTS model
2. **Video Composition**: The audio is overlaid onto your gameplay video
3. **Optimization**: The video is automatically scaled to Instagram Reels format
4. **Export**: The final .mp4 file is ready to upload to Instagram

## Project Structure

```
src/
├── main/
│   ├── index.js          # Electron main process
│   └── preload.js        # IPC bridge
├── renderer/
│   ├── index.html        # UI layout
│   ├── styles.css        # Styling
│   └── app.js            # UI logic
└── services/
    ├── tts.js            # Text-to-speech service
    ├── videoComposer.js  # Video composition pipeline
    └── gameplayManager.js # Gameplay library management
```

## Technology Stack

- **Electron** - Desktop application framework
- **HuggingFace Transformers** - Text-to-speech models
- **FFmpeg** - Video processing and encoding
- **Node.js** - Backend runtime

## Settings & Configuration

### Output Folders

- **Audio files**: `~/.ai-video-story-gen/audio/`
- **Video files**: `~/.ai-video-story-gen/videos/`
- **Gameplay library**: `~/.ai-video-story-gen/gameplay/`

### Instagram Reels Specifications

- **Resolution**: 1080x1920 (9:16 aspect ratio)
- **Duration**: 15-90 seconds
- **Frame rate**: 30fps
- **Video codec**: H.264
- **Audio codec**: AAC (128kbps)
- **Container**: MP4

## Troubleshooting

### FFmpeg Not Found
- Ensure FFmpeg is installed and in your system PATH
- Test: `ffmpeg -version` in terminal

### TTS Model Download Slow
- First run downloads the model (~500MB)
- Subsequent runs use cached model (much faster)

### Video Quality Issues
- Ensure gameplay video is high quality and in landscape or portrait format
- Try different video files if composition fails

### Audio Not Syncing
- Verify audio duration matches video duration
- Check that audio file is valid WAV format

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the Electron app with hot-reload capabilities.

### Building for Distribution

```bash
npm run dist
```

This creates installers for Windows, macOS, and Linux.

## Roadmap

- [ ] Multi-language support for TTS
- [ ] Real-time gameplay capture (screen recording)
- [ ] Batch video generation
- [ ] Advanced video effects and transitions
- [ ] Batch caption positioning
- [ ] Custom music overlays
- [ ] Video templates
- [ ] Cloud export to social media

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Happy creating! 🎬✨**
