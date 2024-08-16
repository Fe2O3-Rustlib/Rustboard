const { app, BrowserWindow, Menu } = require("electron");
path = require("path");

function createWindow() {
  console.log(path);
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: "renderer.js", // Preload script
        contextIsolation: false, // To access Node.js API directly in renderer process (optional)
        nodeIntegration: true // Enable Node.js integration in the renderer process (optional)
      },
      //frame: false,
      icon: "./icons/icon.png",
    });  
    win.loadFile('index.html');
}

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
    createWindow()
  })