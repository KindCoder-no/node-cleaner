import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Main API calls
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanNodeModules: (path: string) => ipcRenderer.invoke('scan-node-modules', path),
  deleteFolders: (folders: string[]) => ipcRenderer.invoke('delete-folders', folders),
  
  // Event listeners
  onFolderSelected: (callback: (path: string) => void) => {
    ipcRenderer.on('folder-selected', (_event, path) => callback(path));
    
    // Return a function to remove the event listener when no longer needed
    return () => {
      ipcRenderer.removeAllListeners('folder-selected');
    };
  }
});
