// Import our window type definition
/// <reference path="./types/window.d.ts" />

// Type definition for scan result
interface NodeModuleFolder {
  path: string;
  size: number;
}

// Get DOM elements
const selectBtn = document.getElementById('select-folder') as HTMLButtonElement;
const resultsDiv = document.getElementById('results') as HTMLDivElement;
const deleteBtn = document.getElementById('delete-folders') as HTMLButtonElement;
const totalDiv = document.getElementById('total') as HTMLDivElement;
const foldersCountDiv = document.getElementById('folders-count') as HTMLDivElement;
const totalSizeDiv = document.getElementById('total-size') as HTMLDivElement;
const confirmationModal = document.getElementById('confirmation-modal') as HTMLDivElement;
const cancelDeleteBtn = document.getElementById('cancel-delete') as HTMLButtonElement;
const confirmDeleteBtn = document.getElementById('confirm-delete') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;

// Store folder paths to delete
let foldersToDelete: string[] = [];
let totalFolderSize = 0;

// Initialize theme
initTheme();

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
  const buttonTextEl = selectBtn.querySelector('.button-text') as HTMLSpanElement;
  if (buttonTextEl) {
    buttonTextEl.textContent = 'Scanning...';
  } else {
    selectBtn.textContent = 'Scanning...';
  }
  
  // Show scanning indicator
  resultsDiv.innerHTML = `
    <div class="scanning">
      <div class="loader"></div>
      <span>Scanning folders, please wait...</span>
    </div>
  `;
  totalDiv.innerHTML = '';
  
  // Reset stats
  foldersCountDiv.textContent = '0';
  totalSizeDiv.textContent = '0 MB';

  try {
    const results: NodeModuleFolder[] = await window.api.scanNodeModules(folderPath);
    foldersToDelete = results.map((r: NodeModuleFolder) => r.path);
    deleteBtn.disabled = foldersToDelete.length === 0;
    
    // Calculate total size
    totalFolderSize = results.reduce((total: number, item: NodeModuleFolder) => total + item.size, 0);
    const totalSizeMB = formatSize(totalFolderSize);
    
    if (results.length > 0) {
      // Find the largest folder size for progress bar scaling
      const maxSize = Math.max(...results.map(r => r.size));
      
      resultsDiv.innerHTML = results.map((r: NodeModuleFolder) => {
        const sizePercentage = (r.size / maxSize) * 100;
        const sizeFormatted = formatSize(r.size);
        
        return `
          <div class="folder-item fade-in">
            <div class="folder-path">${r.path}</div>
            <div class="folder-size">${sizeFormatted}</div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${sizePercentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
      
      // Update total counter in header
      totalDiv.innerHTML = `${results.length} items`;
      
      // Update sidebar stats
      foldersCountDiv.textContent = results.length.toString();
      totalSizeDiv.textContent = totalSizeMB;
    } else {
      resultsDiv.innerHTML = '<div class="no-results">No node_modules folders found in the selected directory.</div>';
      totalDiv.innerHTML = '';
    }
  } catch (error: any) {
    resultsDiv.innerHTML = `<div class="error">Error scanning folders: ${error?.message || 'Unknown error'}</div>`;
  } finally {
    // Re-enable select button
    selectBtn.disabled = false;
    if (buttonTextEl) {
      buttonTextEl.textContent = 'Select Folder to Scan';
    } else {
      selectBtn.textContent = 'Select Folder to Scan';
    }
  }
}

// Format file size to human-readable format
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle folder selection
selectBtn.addEventListener('click', async () => {
  try {
    const folder = await window.api.selectFolder();
    if (folder) {
      scanFolder(folder);
    }
  } catch (error: any) {
    resultsDiv.innerHTML = `<div class="error">Error selecting folder: ${error?.message || 'Unknown error'}</div>`;
  }
});

// Show confirmation modal on delete button click
deleteBtn.addEventListener('click', () => {
  confirmationModal.style.display = 'flex';
});

// Cancel deletion
cancelDeleteBtn.addEventListener('click', () => {
  confirmationModal.style.display = 'none';
});

// Confirm deletion
confirmDeleteBtn.addEventListener('click', async () => {
  try {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';
    
    await window.api.deleteFolders(foldersToDelete);
    
    confirmationModal.style.display = 'none';
    resultsDiv.innerHTML = '<div class="fade-in no-results">All node_modules folders have been deleted successfully!</div>';
    totalDiv.innerHTML = ``;
    
    // Update sidebar stats after deletion
    foldersCountDiv.textContent = '0';
    totalSizeDiv.textContent = `${formatSize(totalFolderSize)} freed`;
    
    foldersToDelete = [];
    deleteBtn.disabled = true;
  } catch (error: any) {
    confirmationModal.style.display = 'none';
    resultsDiv.innerHTML = `<div class="error">Error deleting folders: ${error?.message || 'Unknown error'}</div>`;
  } finally {
    confirmDeleteBtn.textContent = 'Yes, Delete All';
    confirmDeleteBtn.disabled = false;
  }
});

// Theme toggle functionality
function initTheme() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme');
  
  // Our default is dark mode now, so we use opposite logic
  if (currentTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    themeToggleBtn.textContent = '🌙';
  } else {
    themeToggleBtn.textContent = '☀️';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const isLightMode = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  themeToggleBtn.textContent = isLightMode ? '🌙' : '☀️';
});
