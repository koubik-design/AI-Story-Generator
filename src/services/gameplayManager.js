const path = require('path');
const fs = require('fs').promises;
const os = require('os');

/**
 * Get list of gameplay video files from a directory
 */
async function getGameplayLibrary(libraryPath) {
  try {
    if (!libraryPath) {
      libraryPath = path.join(os.homedir(), '.ai-video-story-gen', 'gameplay');
    }

    // Create library directory if it doesn't exist
    await fs.mkdir(libraryPath, { recursive: true });

    // Read directory
    const files = await fs.readdir(libraryPath);

    // Filter for video files
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
    const gameplayFiles = files.filter((file) => {
      return videoExtensions.some((ext) => file.toLowerCase().endsWith(ext));
    });

    // Get file stats
    const fileStats = await Promise.all(
      gameplayFiles.map(async (file) => {
        const filePath = path.join(libraryPath, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stat.size,
          sizeFormatted: formatFileSize(stat.size),
          lastModified: stat.mtime,
        };
      })
    );

    return fileStats.sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error('Error reading gameplay library:', error);
    return [];
  }
}

/**
 * Add a gameplay file to the library
 */
async function addToLibrary(sourceFilePath, libraryPath) {
  try {
    if (!libraryPath) {
      libraryPath = path.join(os.homedir(), '.ai-video-story-gen', 'gameplay');
    }

    // Create library directory if needed
    await fs.mkdir(libraryPath, { recursive: true });

    // Get filename
    const filename = path.basename(sourceFilePath);
    const destPath = path.join(libraryPath, filename);

    // Copy file
    await fs.copyFile(sourceFilePath, destPath);

    console.log(`Added to library: ${destPath}`);
    return destPath;
  } catch (error) {
    console.error('Error adding to library:', error);
    throw error;
  }
}

/**
 * Remove a gameplay file from the library
 */
async function removeFromLibrary(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`Removed from library: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error removing from library:', error);
    throw error;
  }
}

/**
 * Get the default gameplay library path
 */
function getLibraryPath() {
  return path.join(os.homedir(), '.ai-video-story-gen', 'gameplay');
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  getGameplayLibrary,
  addToLibrary,
  removeFromLibrary,
  getLibraryPath,
  formatFileSize,
};
