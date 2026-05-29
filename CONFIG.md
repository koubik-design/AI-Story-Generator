# AI Video Story Generator - Configuration

## Environment Setup

Configure Node environment variables if needed:

```bash
# Use more memory for model loading (if needed)
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable detailed logging
export DEBUG="*"
```

## FFmpeg Configuration

The app requires FFmpeg for video processing. It will automatically detect FFmpeg from your system PATH.

If FFmpeg is installed in a custom location, you can set:
```bash
export FFMPEG_PATH="/path/to/ffmpeg"
```

## Model Cache

HuggingFace models are cached in:
- **Linux/macOS**: `~/.cache/huggingface/`
- **Windows**: `%USERPROFILE%\.cache\huggingface\`

## Application Data

All generated files are stored in:
- **Audio**: `~/.ai-video-story-gen/audio/`
- **Videos**: `~/.ai-video-story-gen/videos/`
- **Gameplay**: `~/.ai-video-story-gen/gameplay/`

## Troubleshooting

### Memory Issues
If you encounter out-of-memory errors, increase Node's memory:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

### FFmpeg Not Found
Verify FFmpeg installation:
```bash
ffmpeg -version
```

### Model Download Timeout
First run may take time to download models (~500MB+).
Set a longer timeout or download separately.
