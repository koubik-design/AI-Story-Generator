const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const DEFAULT_SPEAKER_EMBEDDINGS_URL = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';

let ttsModel = null;

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
      audioOutput = await ttsModel(text, {
        speaker_embeddings: DEFAULT_SPEAKER_EMBEDDINGS_URL,
      });
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

    if (audioOutput && await saveAudioOutputToWav(audioOutput, audioPath)) {
      console.log(`Audio saved to: ${audioPath}`);
      return audioPath;
    }

    // No usable audio returned => create silent WAV as fallback so pipeline can continue
    await writeSilentWav(audioPath, estimateDurationSeconds(text));
    console.log('Fell back to silent WAV:', audioPath);

    console.log(`Audio saved to: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate TTS audio: ' + error.message);
  }
}

/**
 * Write a WAV file for typed array audio data.
 */
async function saveAudioOutputToWav(audioOutput, filePath) {
  const candidate = audioOutput && (audioOutput.audio ?? audioOutput.data ?? audioOutput.waveform ?? audioOutput.blob ?? audioOutput);
  if (!candidate) {
    return false;
  }

  if (Buffer.isBuffer(candidate)) {
    await fs.writeFile(filePath, candidate);
    return true;
  }

  if (candidate instanceof ArrayBuffer) {
    await fs.writeFile(filePath, Buffer.from(candidate));
    return true;
  }

  if (ArrayBuffer.isView(candidate)) {
    if (candidate instanceof Int16Array) {
      await writeWavFile(filePath, candidate, audioOutput.sampling_rate || 16000);
      return true;
    }

    if (candidate instanceof Float32Array || candidate instanceof Float64Array) {
      const pcm = floatTo16BitPCM(candidate);
      await writeWavFile(filePath, pcm, audioOutput.sampling_rate || 16000);
      return true;
    }

    const floatArray = Float32Array.from(candidate);
    const pcm = floatTo16BitPCM(floatArray);
    await writeWavFile(filePath, pcm, audioOutput.sampling_rate || 16000);
    return true;
  }

  if (typeof candidate === 'string') {
    try {
      const buffer = Buffer.from(candidate, 'base64');
      if (buffer.length > 0) {
        await fs.writeFile(filePath, buffer);
        return true;
      }
    } catch (e) {
      // not base64
    }
  }

  return false;
}

function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return int16Array;
}

async function writeWavFile(filePath, samples, sampleRate, numChannels = 1, bitsPerSample = 16) {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const audioBuffer = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  audioBuffer.copy(buffer, 44);
  await fs.writeFile(filePath, buffer);
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
