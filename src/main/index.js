const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../renderer/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  const startURL = `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startURL);

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
const ttsService = require('../services/tts');
const videoComposer = require('../services/videoComposer');

ipcMain.handle('generate-tts', async (event, text) => {
  try {
    const audioPath = await ttsService.generateAudio(text);
    return { success: true, audioPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('compose-video', async (event, config) => {
  try {
    const videoPath = await videoComposer.composeVideo(config);
    return { success: true, videoPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result;
});
