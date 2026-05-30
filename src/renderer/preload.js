const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  generateTTS: (text) => ipcRenderer.invoke('generate-tts', text),
  generateStory: (prompt) => ipcRenderer.invoke('generate-story', prompt),
  composeVideo: (config) => ipcRenderer.invoke('compose-video', config),
  syncBucket: (sourceUri, destinationPath) => ipcRenderer.invoke('sync-bucket', sourceUri, destinationPath),
  uploadBucket: (localPath, bucketUri) => ipcRenderer.invoke('upload-bucket', localPath, bucketUri),
  downloadBucket: (bucketUri, localPath) => ipcRenderer.invoke('download-bucket', bucketUri, localPath),
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  onProgress: (callback) => ipcRenderer.on('progress', (event, data) => callback(data)),
  onError: (callback) => ipcRenderer.on('error', (event, data) => callback(data)),
});
