const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const fsSync = require('fs');

// Try to use ffmpeg from system PATH, or specify path if needed
// Ensure fluent-ffmpeg knows the system ffmpeg/ffprobe locations
try {
  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
  ffmpeg.setFfprobePath('/usr/bin/ffprobe');
} catch (e) {
  // ignore if not available on some platforms
}

/**
 * Check if ffmpeg is installed and accessible
 */
async function verifyFFmpeg() {
  const { spawnSync } = require('child_process');
  try {
    const whichFfmpeg = spawnSync('which', ['ffmpeg']);
    return whichFfmpeg && whichFfmpeg.status === 0;
  } catch (e) {
    return false;
  }
}

/**
 * Get video information (duration, resolution, etc.)
 */
async function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to read video metadata: ${err.message}`));
      } else {
        resolve(metadata);
      }
    });
  });
}

/**
 * Compose video by combining gameplay footage with TTS audio
 * @param {Object} config - Configuration object
 * @param {string} config.gameplayPath - Path to gameplay video
 * @param {string} config.audioPath - Path to TTS audio (WAV)
 * @param {string} config.outputFilename - Output filename
 * @param {number} config.duration - Video duration in seconds
 * @param {boolean} config.addCaptions - Whether to add text captions
 * @param {string} config.storyText - Story text for captions
 * @returns {Promise<string>} - Path to generated video
 */
async function composeVideo(config) {
  const { gameplayPath, audioPath, outputFilename, duration, addCaptions, storyText } = config;

  try {
    // Validate inputs
    if (!gameplayPath || !audioPath) {
      throw new Error('Missing required inputs: gameplayPath and audioPath');
    }

    // Check if files exist
    try {
      await fs.access(gameplayPath);
      await fs.access(audioPath);
    } catch (error) {
      throw new Error(`Input file not found: ${error.message}`);
    }

    // Verify ffmpeg is available
    const ffmpegAvailable = await verifyFFmpeg();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg is not installed. Please install FFmpeg to use video composition features.');
    }

    // Create output directory
    const outputDir = path.join(os.homedir(), '.ai-video-story-gen', 'videos');
    await fs.mkdir(outputDir, { recursive: true });

    // Generate output path
    const timestamp = Date.now();
    const finalOutputPath = path.join(outputDir, `${timestamp}_${outputFilename}`);

    console.log(`Starting video composition...`);
    console.log(`  Gameplay: ${gameplayPath}`);
    console.log(`  Audio: ${audioPath}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Output: ${finalOutputPath}`);

    // Build FFmpeg command
    // This creates a video in Instagram Reels format: 1080x1920 (9:16 aspect ratio)
    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(gameplayPath)
        // Overlay audio
        .input(audioPath)
        // Set output format
        .format('mp4')
        // Scale to Instagram Reels size (1080x1920)
        .videoCodec('libx264')
        .size('1080x1920')
        .aspect('9:16')
        // Audio settings
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100)
        // Video quality
        .videoBitrate('5000k')
        .fps(30)
        // Duration
        .duration(duration)
        // Output
        .output(finalOutputPath);

      // Add captions using drawtext if requested
      if (addCaptions && storyText) {
        console.log('Text captions enabled');
        // Find a common font
        const fontCandidates = [
          '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
        ];
        let fontfile = null;
        for (const f of fontCandidates) {
          if (fsSync.existsSync(f)) { fontfile = f; break; }
        }

        // Escape text for ffmpeg drawtext
        const escapedText = (storyText || '').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/\\n/g, '\\n');

        let drawtext = `drawtext=text='${escapedText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h-(text_h)-80`;
        if (fontfile) {
          drawtext = `drawtext=fontfile='${fontfile}':` + drawtext.replace(/^drawtext:/, '');
        }

        // Apply video filter
        cmd = cmd.videoFilters(drawtext);
      }

      cmd.on('start', (command) => {
        console.log('FFmpeg process started');
      })
        .on('progress', (progress) => {
          if (progress && typeof progress.percent === 'number') {
            console.log(`  Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Video composition failed: ${err.message}`));
        })
        .on('end', () => {
          console.log(`Video composition completed: ${finalOutputPath}`);
          resolve(finalOutputPath);
        })
        .run();
    });
  } catch (error) {
    console.error('Video composition error:', error);
    throw error;
  }
}

/**
 * Validate video for Instagram compatibility
 */
async function validateForInstagram(videoPath) {
  try {
    const metadata = await getVideoInfo(videoPath);
    const video = metadata.streams.find((s) => s.codec_type === 'video');
    const audio = metadata.streams.find((s) => s.codec_type === 'audio');

    const issues = [];

    // Check aspect ratio (should be 9:16)
    if (video) {
      const aspectRatio = video.width / video.height;
      if (Math.abs(aspectRatio - 9 / 16) > 0.01) {
        issues.push(`Aspect ratio is ${video.width}x${video.height} (${aspectRatio.toFixed(2)}). Instagram Reels should be 9:16.`);
      }
    }

    // Check duration (should be 15-90 seconds)
    const duration = metadata.format.duration;
    if (duration < 15 || duration > 90) {
      issues.push(`Duration is ${Math.round(duration)}s. Instagram Reels should be 15-90 seconds.`);
    }

    // Check codec
    if (video && video.codec_name !== 'h264') {
      issues.push(`Video codec is ${video.codec_name}. Instagram prefers H.264.`);
    }

    return {
      valid: issues.length === 0,
      issues,
      duration: Math.round(duration),
      resolution: video ? `${video.width}x${video.height}` : 'unknown',
      codec: video ? video.codec_name : 'unknown',
    };
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}

module.exports = {
  composeVideo,
  getVideoInfo,
  validateForInstagram,
  verifyFFmpeg,
};
