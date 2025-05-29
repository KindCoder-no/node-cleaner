import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

let mainWindow: BrowserWindow;

function createAppMenu() {
  const isMac = process.platform === 'darwin';
  
  // Define menu template with proper types
  const template: Electron.MenuItemConstructorOptions[] = [];
  
  // macOS specific menu
  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }
  
  // File menu
  template.push({
    label: 'File',
    submenu: [
      {
        label: 'Select Folder',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          if (mainWindow) {
            const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('folder-selected', result.filePaths[0]);
            }
          }
        }
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  });
  
  // View menu
  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  });
  
  // Help menu
  template.push({
    label: 'Help',
    submenu: [
      {
        label: 'About Node Modules Cleaner',
        click: async () => {
          await dialog.showMessageBox({
            title: 'About Node Modules Cleaner',
            message: 'Node Modules Cleaner v1.0.0',
            detail: 'A tool to find and clean up node_modules folders.\n\nCreated by Emre Sanden',
            buttons: ['OK']
          });
        }
      },
      {
        label: 'GitHub Repository',
        click: async () => {
          await shell.openExternal('https://github.com/KindCoder-no/node-cleaner');
        }
      }
    ]
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/assets/icon.svg'),
    show: false, // Don't show until ready
    backgroundColor: '#f5f5f5',
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  
  // Only show window when it's ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Create application menu
  createAppMenu();
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.filePaths[0];
  });

  ipcMain.handle('scan-node-modules', async (_event, basePath: string) => {
    const found: { path: string; size: number }[] = [];
    const ignoreDirs = ['.git', 'node_modules', '.svn']; // Don't scan inside node_modules recursively

    async function getAllNodeModules(dir: string) {
      try {
        const items = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          if (!item.isDirectory()) continue;
          
          const fullPath = path.join(dir, item.name);
          
          // If it's a node_modules folder
          if (item.name === 'node_modules') {
            const size = await getFolderSize(fullPath);
            found.push({ path: fullPath, size });
          } 
          // For regular directories, continue scanning if they're not in our ignore list
          else if (!ignoreDirs.includes(item.name)) {
            await getAllNodeModules(fullPath);
          }
        }
      } catch (error) {
        // Silently handle permission errors
      }
    }

    async function getFolderSize(dirPath: string): Promise<number> {
      let total = 0;
      
      // Use a queue for BFS traversal instead of recursion to avoid stack overflow
      const queue: string[] = [dirPath];
      
      while (queue.length > 0) {
        const currentPath = queue.shift()!;
        
        try {
          const items = await fsPromises.readdir(currentPath, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(currentPath, item.name);
            
            try {
              if (item.isFile()) {
                const stats = await fsPromises.stat(fullPath);
                total += stats.size;
              } else if (item.isDirectory()) {
                queue.push(fullPath);
              }
            } catch (error) {
              // Skip files we can't access
            }
          }
        } catch (error) {
          // Skip directories we can't access
        }
      }
      
      return total;
    }

    await getAllNodeModules(basePath);
    
    // Sort the results by size (largest first)
    found.sort((a, b) => b.size - a.size);
    
    return found;
  });

  ipcMain.handle('delete-folders', async (_event, folders: string[]) => {
    const results = {
      success: 0,
      failed: 0,
      totalSize: 0
    };
    
    for (const folder of folders) {
      try {
        // Get folder size before deletion for reporting
        const stats = await fsPromises.stat(folder);
        const size = stats.size;
        
        // Delete the folder
        await fsPromises.rm(folder, { recursive: true, force: true });
        
        results.success++;
        results.totalSize += size;
      } catch (error) {
        console.error(`Error deleting ${folder}:`, error);
        results.failed++;
      }
    }
    
    return results.failed === 0;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
