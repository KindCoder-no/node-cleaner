// Import our window type definition
/// <reference path="./types/window.d.ts" />

// Type definition for scan result
interface NodeModuleFolder {
  path: string;
  size: number;
}

const selectBtn = document.getElementById('select-folder') as HTMLButtonElement;
const resultsDiv = document.getElementById('results') as HTMLDivElement;
const deleteBtn = document.getElementById('delete-folders') as HTMLButtonElement;
const totalDiv = document.getElementById('total') as HTMLDivElement;

let foldersToDelete: string[] = [];

// Subscribe to folder-selected event from the menu
window.api.onFolderSelected((folderPath: string) => {
  if (folderPath) {
    scanFolder(folderPath);
  }
});

// Function to scan a folder for node_modules
async function scanFolder(folderPath: string) {
  // Disable select button during scan
  selectBtn.disabled = true;
  selectBtn.textContent = 'Scanning...';
  resultsDiv.innerHTML = '<div class="scanning">Scanning folders, please wait...</div>';
  totalDiv.innerHTML = '';

  try {
    const results: NodeModuleFolder[] = await window.api.scanNodeModules(folderPath);
    foldersToDelete = results.map((r: NodeModuleFolder) => r.path);
    deleteBtn.disabled = foldersToDelete.length === 0;
    
    // Calculate total size
    const totalSize = results.reduce((total: number, item: NodeModuleFolder) => total + item.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    if (results.length > 0) {
      resultsDiv.innerHTML = results.map((r: NodeModuleFolder) => `
        <div class="folder-item">
          <b>${r.path}</b> - ${(r.size / 1024 / 1024).toFixed(2)} MB
        </div>
      `).join('');
      
      totalDiv.innerHTML = `Found ${results.length} node_modules ${results.length === 1 ? 'folder' : 'folders'} - Total: ${totalSizeMB} MB`;
    } else {
      resultsDiv.innerHTML = '<div>No node_modules folders found.</div>';
      totalDiv.innerHTML = '';
    }
  } catch (error: any) {
    resultsDiv.innerHTML = `<div>Error scanning folders: ${error?.message || 'Unknown error'}</div>`;
  } finally {
    // Re-enable select button
    selectBtn.disabled = false;
    selectBtn.textContent = 'Select Folder';
  }
}

selectBtn.addEventListener('click', async () => {
  try {
    const folder = await window.api.selectFolder();
    if (folder) {
      scanFolder(folder);
    }
  } catch (error: any) {
    resultsDiv.innerHTML = `<div>Error selecting folder: ${error?.message || 'Unknown error'}</div>`;
  }
});

deleteBtn.addEventListener('click', async () => {
  try {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    await window.api.deleteFolders(foldersToDelete);
    
    alert('All node_modules folders deleted successfully!');
    resultsDiv.innerHTML = '';
    totalDiv.innerHTML = '';
    foldersToDelete = [];
  } catch (error: any) {
    alert(`Error deleting folders: ${error?.message || 'Unknown error'}`);
  } finally {
    deleteBtn.textContent = 'Delete All node_modules';
    deleteBtn.disabled = true;
  }
});
