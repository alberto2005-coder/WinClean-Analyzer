const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 950,
    minHeight: 650,
    frame: false, // Borderless, ultra-premium visual design
    backgroundColor: '#0d0d12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools during development if needed
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- WINDOW WINDOW CONTROLS ---
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  return true;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
  return true;
});

// --- HELPER TO RUN POWERSHELL COMMANDS ---
function runPowerShell(command) {
  return new Promise((resolve) => {
    // We use bypass execution policy and UTF-8 encoding
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command.replace(/"/g, '\\"')}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve('');
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// --- TELEMETRY: CPU & RAM & DISK ---
let lastCpuUsage = { idle: 0, total: 0 };

function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(core => {
    for (const type in core.times) {
      totalTick += core.times[type];
    }
    totalIdle += core.times.idle;
  });
  return { idle: totalIdle, total: totalTick };
}

// Pre-initialize cpu usage measurement
lastCpuUsage = getCPUUsage();

ipcMain.handle('get-system-stats', async () => {
  // 1. Calculate native CPU usage instantaneously (difference over 150ms)
  const start = getCPUUsage();
  await new Promise(r => setTimeout(r, 150));
  const end = getCPUUsage();
  const idleDifference = end.idle - start.idle;
  const totalDifference = end.total - start.total;
  let cpuPercent = 0;
  if (totalDifference > 0) {
    cpuPercent = 100 - Math.floor((100 * idleDifference) / totalDifference);
  }

  // 2. RAM Usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const ramPercent = Math.round((usedMem / totalMem) * 100);

  // 3. Disk Space (C:)
  let diskSpace = { total: 0, free: 0, used: 0, usedPercent: 0 };
  try {
    const stats = fs.statfsSync('C:\\');
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;
    const usedBytes = totalBytes - freeBytes;
    diskSpace = {
      total: Math.round(totalBytes / (1024 * 1024 * 1024)), // GB
      free: Math.round(freeBytes / (1024 * 1024 * 1024)),   // GB
      used: Math.round(usedBytes / (1024 * 1024 * 1024)),   // GB
      usedPercent: Math.round((usedBytes / totalBytes) * 100)
    };
  } catch (err) {
    // Fallback if statfs fails
  }

  return {
    cpu: cpuPercent,
    ram: {
      percent: ramPercent,
      total: (totalMem / (1024 * 1024 * 1024)).toFixed(1), // GB
      used: (usedMem / (1024 * 1024 * 1024)).toFixed(1)   // GB
    },
    disk: diskSpace
  };
});

// --- PROCESS MANAGER ---
ipcMain.handle('get-processes', async () => {
  // Query top 30 processes eating more than 10MB of RAM, sorted by memory usage
  const psCmd = `Get-Process | Where-Object { $_.WorkingSet64 -gt 10MB } | Sort-Object -Property WorkingSet64 -Descending | Select-Object -First 30 Name, Id, CPU, @{Name='Memory';Expression={[Math]::Round($_.WorkingSet64 / 1MB, 1)}} | ConvertTo-Json`;
  const result = await runPowerShell(psCmd);
  
  try {
    if (!result) return [];
    const parsed = JSON.parse(result);
    // If only one process is returned, PowerShell doesn't make an array, wrap it in one
    const processList = Array.isArray(parsed) ? parsed : [parsed];
    return processList.map(p => ({
      name: p.Name,
      pid: p.Id,
      cpu: p.CPU ? Math.round(p.CPU) : 0,
      memory: p.Memory
    }));
  } catch (err) {
    return [];
  }
});

ipcMain.handle('kill-process', async (event, pid) => {
  return new Promise((resolve) => {
    exec(`taskkill /F /PID ${pid}`, (err) => {
      resolve(!err);
    });
  });
});

// --- STARTUP MONITOR ---
ipcMain.handle('get-startup-apps', async () => {
  const startupCmd = `Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json`;
  const result = await runPowerShell(startupCmd);
  
  try {
    if (!result) return [];
    const parsed = JSON.parse(result);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(item => ({
      name: item.Name,
      command: item.Command,
      location: item.Location.includes('Run') ? 'Registro (Registro de Windows)' : 'Carpeta Inicio (Startup Folder)'
    }));
  } catch (err) {
    return [];
  }
});

// --- SCAN SYSTEM FILE CACHES & TEMPS ---
const scanPaths = {
  userTemp: process.env.TEMP,
  systemTemp: 'C:\\Windows\\Temp',
  prefetch: 'C:\\Windows\\Prefetch',
  systemLogs: 'C:\\Windows\\Logs',
  chromeCache: path.join(process.env.USERPROFILE, 'AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data'),
  edgeCache: path.join(process.env.USERPROFILE, 'AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data'),
  downloads: path.join(process.env.USERPROFILE, 'Downloads')
};

async function scanFolderAsync(dirPath) {
  let size = 0;
  let fileCount = 0;

  // Temporarily disable Electron's ASAR archive interception
  const originalNoAsar = process.noAsar;
  process.noAsar = true;

  async function traverse(currentPath) {
    try {
      const stats = await fs.promises.stat(currentPath);
      if (stats.isFile()) {
        size += stats.size;
        fileCount++;
        
        // Yield to the event loop every 150 files to keep the Electron UI 100% fluid
        if (fileCount % 150 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      } else if (stats.isDirectory()) {
        const files = await fs.promises.readdir(currentPath);
        for (const file of files) {
          await traverse(path.join(currentPath, file));
        }
      }
    } catch (e) {
      // Skip files that are locked by other processes
    }
  }

  try {
    if (fs.existsSync(dirPath)) {
      await traverse(dirPath);
    }
  } catch (err) {
    // Skip failures silently
  } finally {
    // Restore original ASAR setting
    process.noAsar = originalNoAsar;
  }

  return { size, fileCount };
}

ipcMain.handle('scan-system', async () => {
  const result = {};
  
  // 1. Scan standard folder paths asynchronously without blocking the UI thread
  for (const [key, dirPath] of Object.entries(scanPaths)) {
    const info = await scanFolderAsync(dirPath);
    result[key] = {
      path: dirPath,
      sizeBytes: info.size,
      sizeMB: (info.size / (1024 * 1024)).toFixed(2),
      files: info.fileCount
    };
  }

  // 2. Scan Recycle Bin size via PowerShell
  const recycleBinBytesStr = await runPowerShell(`(Get-ChildItem -Path 'C:\\$Recycle.Bin' -Force -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum`);
  const recycleBinBytes = parseInt(recycleBinBytesStr) || 0;
  result['recycleBin'] = {
    path: 'Papelera de Reciclaje',
    sizeBytes: recycleBinBytes,
    sizeMB: (recycleBinBytes / (1024 * 1024)).toFixed(2),
    files: 'N/A'
  };

  return result;
});

// --- CLEAN SYSTEM FILES ---
async function cleanFolderAsync(dirPath) {
  let deletedCount = 0;
  let deletedSize = 0;
  let lockedCount = 0;

  // Temporarily disable Electron's ASAR archive interception
  const originalNoAsar = process.noAsar;
  process.noAsar = true;

  async function traverseAndDelete(currentPath, isRoot = false) {
    try {
      const stats = await fs.promises.stat(currentPath);
      if (stats.isFile()) {
        const fileSize = stats.size;
        await fs.promises.unlink(currentPath);
        deletedCount++;
        deletedSize += fileSize;
        
        // Yield to the event loop every 100 files to keep the Electron UI 100% fluid
        if (deletedCount % 100 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      } else if (stats.isDirectory()) {
        const files = await fs.promises.readdir(currentPath);
        for (const file of files) {
          await traverseAndDelete(path.join(currentPath, file), false);
        }
        if (!isRoot) {
          await fs.promises.rmdir(currentPath);
        }
      }
    } catch (e) {
      lockedCount++;
    }
  }

  try {
    if (fs.existsSync(dirPath)) {
      await traverseAndDelete(dirPath, true);
    }
  } catch (err) {
    // Skip failures silently
  } finally {
    // Restore original ASAR setting
    process.noAsar = originalNoAsar;
  }

  return { deletedCount, deletedSize, lockedCount };
}

ipcMain.handle('clean-system', async (event, categories) => {
  const report = {
    freedBytes: 0,
    freedMB: '0.00',
    cleanedFiles: 0,
    lockedFiles: 0,
    details: {}
  };

  // 1. Clean folders asynchronously
  for (const category of categories) {
    if (scanPaths[category]) {
      const cleanResult = await cleanFolderAsync(scanPaths[category]);
      report.freedBytes += cleanResult.deletedSize;
      report.cleanedFiles += cleanResult.deletedCount;
      report.lockedFiles += cleanResult.lockedCount;
      report.details[category] = {
        sizeMB: (cleanResult.deletedSize / (1024 * 1024)).toFixed(2),
        files: cleanResult.deletedCount,
        locked: cleanResult.lockedCount
      };
    }
  }

  // 2. Clean Recycle Bin
  if (categories.includes('recycleBin')) {
    const recycleBinBytesStr = await runPowerShell(`(Get-ChildItem -Path 'C:\\$Recycle.Bin' -Force -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum`);
    const size = parseInt(recycleBinBytesStr) || 0;
    
    await runPowerShell(`Clear-RecycleBin -Force -ErrorAction SilentlyContinue`);
    
    report.freedBytes += size;
    report.cleanedFiles += 1;
    report.details['recycleBin'] = {
      sizeMB: (size / (1024 * 1024)).toFixed(2),
      files: 1,
      locked: 0
    };
  }

  // Flush DNS Cache
  if (categories.includes('dnsCache')) {
    await runPowerShell('ipconfig /flushdns');
    report.details['dnsCache'] = {
      sizeMB: '0.00',
      files: 1,
      locked: 0
    };
  }

  report.freedMB = (report.freedBytes / (1024 * 1024)).toFixed(2);
  return report;
});
