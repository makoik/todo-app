const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const dataFilePath = path.join(__dirname, '/data/', 'tabledata.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Only if not using preload.js
      enableRemoteModule: false,
      nodeIntegration: false,  // Only if you trust your code
    }
  });
  
  // win.loadURL('http://localhost:5173');
  win.loadFile(path.join(__dirname, 'build/index.html'));
  // win.webContents.openDevTools();
}

// IPC handlers

// Load tasks from file
ipcMain.handle('get-tasks', async () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading tasks:', err);
    return [];
  }
});

// Save tasks to file
ipcMain.handle('save-tasks', async (_event, tasks) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(tasks, null, 2));
    return { success: true };
  } catch (err) {
    console.error('Error saving tasks:', err);
    return { success: false, error: err.message };
  }
});

// Delete Confirm dialog window
ipcMain.handle('show-confirm.dialog', async (_event, message) => {
  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Confirm',
    message,
  });
  return result.response === 0; // 0 = 'Yes'
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});