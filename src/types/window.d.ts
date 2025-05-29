// Custom type definitions for the Window interface
interface Window {
  api: {
    // Main API methods
    selectFolder: () => Promise<string>;
    scanNodeModules: (path: string) => Promise<{ path: string; size: number }[]>;
    deleteFolders: (folders: string[]) => Promise<boolean>;
    
    // Event listeners
    onFolderSelected: (callback: (path: string) => void) => () => void;
  };
}
