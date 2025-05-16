const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backend;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
    }
  });

  win.loadFile(path.join(__dirname, 'build/index.html'));
}

function startBackend() {
  backend = spawn('node', ['api/index.js'], {
    cwd: __dirname,
    shell: true,
    detached: true,
    stdio: 'ignore'
  });

  backend.unref();
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (backend) backend.kill();
  if (process.platform !== 'darwin') app.quit();
});
