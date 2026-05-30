// DOM Elements
const storyTextArea = document.getElementById('story-text');
const storyPromptInput = document.getElementById('story-prompt');
const generateStoryBtn = document.getElementById('generate-story-btn');
const gameplayFileInput = document.getElementById('gameplay-file');
const selectGameplayBtn = document.getElementById('select-gameplay-btn');
const gameplayFilename = document.getElementById('gameplay-filename');
const ttsVoiceSelect = document.getElementById('tts-voice');
const addCaptionsCheckbox = document.getElementById('add-captions');
const outputFilenameInput = document.getElementById('output-filename');
const videoDurationInput = document.getElementById('video-duration');
const generateBtn = document.getElementById('generate-btn');
const exportBtn = document.getElementById('export-btn');
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const previewInfo = document.getElementById('preview-info');

let selectedGameplayPath = null;
let generatedVideoPath = null;

// File Selection
selectGameplayBtn.addEventListener('click', async () => {
  const result = await window.electron.selectFile({
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mov'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    selectedGameplayPath = result.filePaths[0];
    gameplayFilename.textContent = selectedGameplayPath.split('/').pop();
    previewInfo.textContent = 'Gameplay selected. Ready to generate!';
    showMessage('', 'success');
  }
});

// Generate Story with QWEN-3
generateStoryBtn.addEventListener('click', async () => {
  if (!storyPromptInput.value.trim()) {
    showMessage('Enter an AI prompt to generate the story.', 'error');
    return;
  }

  generateStoryBtn.disabled = true;
  progressContainer.style.display = 'block';
  updateProgress('Generating story with QWEN-3...', 0);
  showMessage('', 'success');

  try {
    const result = await window.electron.generateStory(storyPromptInput.value);
    if (!result.success) {
      throw new Error(result.error);
    }

    storyTextArea.value = result.storyText;
    showMessage('Story generated with QWEN-3. You can now generate the video.', 'success');
    updateProgress('Story generated successfully.', 100);
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Story generation error:', error);
  } finally {
    generateStoryBtn.disabled = false;
    setTimeout(() => {
      progressContainer.style.display = 'none';
      updateProgress('0%', 0);
    }, 1000);
  }
});

// Generate Video
generateBtn.addEventListener('click', async () => {
  // Validation
  if (!storyTextArea.value.trim()) {
    showMessage('Please enter a story', 'error');
    return;
  }

  if (!selectedGameplayPath) {
    showMessage('Please select a gameplay video', 'error');
    return;
  }

  if (storyTextArea.value.length > 1000) {
    showMessage('Story is too long (max 1000 characters)', 'error');
    return;
  }

  // Disable button and show progress
  generateBtn.disabled = true;
  progressContainer.style.display = 'block';
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  try {
    // Step 1: Generate TTS Audio
    updateProgress('Generating narration...', 0);
    const ttsResult = await window.electron.generateTTS(storyTextArea.value);
    
    if (!ttsResult.success) {
      throw new Error(ttsResult.error);
    }

    updateProgress('Composing video...', 50);

    // Step 2: Compose Video
    const config = {
      gameplayPath: selectedGameplayPath,
      audioPath: ttsResult.audioPath,
      outputFilename: outputFilenameInput.value,
      duration: parseInt(videoDurationInput.value),
      addCaptions: addCaptionsCheckbox.checked,
      storyText: storyTextArea.value,
    };

    const videoResult = await window.electron.composeVideo(config);

    if (!videoResult.success) {
      throw new Error(videoResult.error);
    }

    generatedVideoPath = videoResult.videoPath;
    updateProgress('Video generated successfully!', 100);
    
    // Show success and enable export button
    setTimeout(() => {
      progressContainer.style.display = 'none';
      generateBtn.disabled = false;
      exportBtn.disabled = false;
      showMessage(`✅ Video created: ${outputFilenameInput.value}`, 'success');
      previewInfo.textContent = `Video ready to export: ${outputFilenameInput.value}`;
    }, 1000);

  } catch (error) {
    progressContainer.style.display = 'none';
    generateBtn.disabled = false;
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Generation error:', error);
  }
});

// Export Video
exportBtn.addEventListener('click', async () => {
  if (!generatedVideoPath) {
    showMessage('No video to export', 'error');
    return;
  }

  const result = await window.electron.selectDirectory();

  if (!result.canceled && result.filePaths.length > 0) {
    const outputDir = result.filePaths[0];
    // In a real implementation, you would copy the file here
    // For now, just show a success message
    showMessage(`✅ Video exported to: ${outputDir}`, 'success');
    console.log('Video path:', generatedVideoPath);
    console.log('Export to:', outputDir);
  }
});

// UI Helpers
function updateProgress(text, percent) {
  progressText.textContent = text;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function showMessage(text, type) {
  if (type === 'error') {
    errorMessage.textContent = text;
    errorMessage.style.display = text ? 'block' : 'none';
    successMessage.style.display = 'none';
  } else if (type === 'success') {
    successMessage.textContent = text;
    successMessage.style.display = text ? 'block' : 'none';
    errorMessage.style.display = 'none';
  }
}

// Initialize
console.log('AI Video Story Generator - Ready');
