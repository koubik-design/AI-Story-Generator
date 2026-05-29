const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  generateTTS: (text) => ipcRenderer.invoke('generate-tts', text),
  composeVideo: (config) => ipcRenderer.invoke('compose-video', config),
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  onProgress: (callback) => ipcRenderer.on('progress', (event, data) => callback(data)),
  onError: (callback) => ipcRenderer.on('error', (event, data) => callback(data)),
});
