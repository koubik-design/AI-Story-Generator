const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let ttsModel = null;
let pipeline = null;

/**
 * Initialize TTS model on first use
 */
async function initializeTTSModel() {
  if (ttsModel) return;

  try {
    console.log('Initializing TTS model...');
    
    // Using Xenova/speecht5_tts via @xenova/transformers
    // This will auto-download the model on first use
    const { pipeline } = await import('@xenova/transformers');
    
    ttsModel = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
      quantized: false, // Set to true for smaller model size
    });
    
    console.log('TTS model initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TTS model:', error);
    throw new Error('Failed to load TTS model: ' + error.message);
  }
}

/**
 * Generate audio from text using HuggingFace TTS
 * @param {string} text - Story text to convert to speech
 * @returns {Promise<string>} - Path to generated WAV file
 */
async function generateAudio(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > 1000) {
    throw new Error('Text is too long (max 1000 characters)');
  }

  try {
    // Optional: force creating a silent WAV for faster testing without model download
    if (process.env.FORCE_SILENT_TTS === '1') {
      const outputDir = path.join(os.homedir(), '.ai-video-story-gen', 'audio');
      await fs.mkdir(outputDir, { recursive: true });
      const audioPath = path.join(outputDir, `narration_silent_${Date.now()}.wav`);
      await writeSilentWav(audioPath, estimateDurationSeconds(text));
      console.log('FORCE_SILENT_TTS active - created silent WAV:', audioPath);
      return audioPath;
    }
    // Initialize model if not already done
    await initializeTTSModel();

    console.log(`Generating TTS audio for text: "${text.substring(0, 50)}..."`);

    // Attempt to generate speech via the HF pipeline
    let audioOutput = null;
    try {
      audioOutput = await ttsModel(text);
    } catch (err) {
      console.warn('TTS model pipeline call failed, falling back to silent WAV:', err.message || err);
      audioOutput = null;
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(os.homedir(), '.ai-video-story-gen', 'audio');
    await fs.mkdir(outputDir, { recursive: true });

    // Save audio file
    const timestamp = Date.now();
    const audioPath = path.join(outputDir, `narration_${timestamp}.wav`);

    // If pipeline returned audio data, try to persist it
    if (audioOutput && (audioOutput.data || audioOutput.audio || audioOutput.waveform || audioOutput.blob)) {
      // Support several possible output shapes
      const candidate = audioOutput.data || audioOutput.audio || audioOutput.waveform || audioOutput.blob;
      if (candidate instanceof Uint8Array || Buffer.isBuffer(candidate)) {
        await fs.writeFile(audioPath, Buffer.from(candidate));
      } else if (typeof candidate === 'string') {
        // base64 or path
        try {
          const buf = Buffer.from(candidate, 'base64');
          await fs.writeFile(audioPath, buf);
        } catch (e) {
          // fallback
          await fs.writeFile(audioPath, Buffer.from([]));
        }
      } else {
        // Unknown format - fallback to silent WAV
        await writeSilentWav(audioPath, estimateDurationSeconds(text));
      }
    } else {
      // No usable audio returned => create silent WAV as fallback so pipeline can continue
      await writeSilentWav(audioPath, estimateDurationSeconds(text));
    }

    console.log(`Audio saved to: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate TTS audio: ' + error.message);
  }
}

/**
 * Estimate narration duration in seconds from text length (rough estimate)
 */
function estimateDurationSeconds(text) {
  const words = text.trim().split(/\s+/).length;
  const wpm = 150; // words per minute
  const minutes = words / wpm;
  const seconds = Math.max(2, Math.round(minutes * 60));
  // clamp to 90s
  return Math.min(90, seconds);
}

/**
 * Write a silent 16-bit PCM WAV file of given duration (mono, 22050 Hz)
 */
async function writeSilentWav(filePath, seconds) {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * seconds;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Silence already zeroed by Buffer.alloc
  await fs.writeFile(filePath, buffer);
}

/**
 * Clear cached models to free up memory
 */
async function clearCache() {
  try {
    ttsModel = null;
    console.log('TTS cache cleared');
  } catch (error) {
    console.error('Error clearing TTS cache:', error);
  }
}

module.exports = {
  generateAudio,
  clearCache,
  initializeTTSModel,
};
