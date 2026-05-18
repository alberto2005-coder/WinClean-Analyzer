const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

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

// --- CHECK FOR CLI AUTOCLEAN FLAG (MANTENIMIENTO SILENCIOSO) ---
if (process.argv.includes('--autoclean')) {
  app.whenReady().then(async () => {
    const defaultCategories = ['userTemp', 'systemTemp', 'prefetch', 'systemLogs', 'chromeCache', 'edgeCache', 'dnsCache'];
    let freedBytes = 0;
    
    // Clean folders
    for (const category of defaultCategories) {
      if (scanPaths[category]) {
        try {
          const cleanResult = await cleanFolderAsync(scanPaths[category]);
          freedBytes += cleanResult.deletedSize;
        } catch (e) {}
      }
    }
    
    // Clean Recycle Bin
    try {
      await runPowerShell(`Clear-RecycleBin -Force -ErrorAction SilentlyContinue`);
    } catch (e) {}
    
    // Clean DNS
    try {
      await runPowerShell('ipconfig /flushdns');
    } catch (e) {}
    
    // Log the result to a small file in user AppData
    try {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logPath = path.join(logDir, 'autoclean.log');
      const logMessage = `[${new Date().toISOString()}] Autoclean completed. Freed ${(freedBytes / (1024 * 1024)).toFixed(2)} MB.\n`;
      fs.appendFileSync(logPath, logMessage);
    } catch (err) {}
    
    // Quit without showing the UI!
    app.quit();
  });
}

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

// --- APPLY PRIVACY & SPEED BOOST REGISTRY & SERVICE TWEAKS ---
ipcMain.handle('apply-privacy-boost', async (event, toggles) => {
  const reports = [];
  
  // 1. Disable Telemetry Service (DiagTrack) & Error Reporting (WerSvc)
  if (toggles.telemetry) {
    await runPowerShell(`Stop-Service -Name DiagTrack -ErrorAction SilentlyContinue; Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue`);
    await runPowerShell(`Stop-Service -Name WerSvc -ErrorAction SilentlyContinue; Set-Service -Name WerSvc -StartupType Disabled -ErrorAction SilentlyContinue`);
    reports.push('Servicios de Telemetría (DiagTrack/WerSvc) desactivados y deshabilitados.');
  } else {
    await runPowerShell(`Set-Service -Name DiagTrack -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name DiagTrack -ErrorAction SilentlyContinue`);
    await runPowerShell(`Set-Service -Name WerSvc -StartupType Manual -ErrorAction SilentlyContinue`);
    reports.push('Servicios de Telemetría restaurados a los valores estándar de Windows.');
  }
  
  // 2. Disable Cortana
  if (toggles.cortana) {
    await runPowerShell(`New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -PropertyType DWORD -Force -ErrorAction SilentlyContinue`);
    reports.push('Búsqueda y telemetría de Cortana bloqueadas en el registro.');
  } else {
    await runPowerShell(`Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue`);
    reports.push('Cortana restaurada a los valores de registro predeterminados.');
  }
  
  // 3. Optimize Windows Start suggestions (disable Bing Search suggestions in Start Menu)
  if (toggles.search) {
    await runPowerShell(`New-Item -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -Value 1 -PropertyType DWORD -Force -ErrorAction SilentlyContinue`);
    reports.push('Sugerencias y anuncios de búsqueda de Bing deshabilitados en el menú Inicio.');
  } else {
    await runPowerShell(`Remove-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -ErrorAction SilentlyContinue`);
    reports.push('Sugerencias de búsqueda del menú Inicio restauradas.');
  }
  
  return { success: true, reports };
});

// --- SAVE AUTOMATED MAINTENANCE SCHEDULE IN WINDOWS TASK SCHEDULER ---
ipcMain.handle('save-schedule', async (event, scheduleType) => {
  const exePath = app.getPath('exe');
  
  // Clean up any previously created task
  await runPowerShell(`Unregister-ScheduledTask -TaskName "WinCleanAnalyzer_AutoClean" -Confirm:$false -ErrorAction SilentlyContinue`);
  
  if (scheduleType === 'off') {
    return { success: true, message: 'Mantenimiento automático desactivado con éxito.' };
  }
  
  let triggerArgs = '';
  let msg = '';
  if (scheduleType === 'daily') {
    triggerArgs = '-Daily -At 03:00';
    msg = 'Mantenimiento diario activado (3:00 AM).';
  } else if (scheduleType === 'weekly') {
    triggerArgs = '-Weekly -DaysOfWeek Sunday -At 03:00';
    msg = 'Mantenimiento semanal activado (Domingos 3:00 AM).';
  } else if (scheduleType === 'monthly') {
    triggerArgs = '-Monthly -At 03:00';
    msg = 'Mantenimiento mensual activado (Días 1 a las 3:00 AM).';
  }
  
  // Create task using PowerShell
  const registerCmd = `Register-ScheduledTask -TaskName "WinCleanAnalyzer_AutoClean" -Trigger (New-ScheduledTaskTrigger ${triggerArgs}) -Action (New-ScheduledTaskAction -Execute "${exePath}" -Argument "--autoclean") -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) -Force -ErrorAction SilentlyContinue`;
  await runPowerShell(registerCmd);
  
  return { success: true, message: `${msg} Se ejecutará de forma silenciosa en segundo plano.` };
});

// --- GET CURRENT PRIVACY & SCHEDULER SYSTEM STATE ---
ipcMain.handle('get-privacy-state', async () => {
  // Check telemetry service status
  const telemetryStatusStr = await runPowerShell(`(Get-Service -Name DiagTrack -ErrorAction SilentlyContinue).StartType`);
  const isTelemetryDisabled = telemetryStatusStr.trim() === 'Disabled';
  
  // Check Cortana registry value
  const cortanaVal = await runPowerShell(`(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue).AllowCortana`);
  const isCortanaDisabled = cortanaVal.trim() === '0';
  
  // Check Search suggestions registry value
  const searchVal = await runPowerShell(`(Get-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -ErrorAction SilentlyContinue).DisableSearchBoxSuggestions`);
  const isSearchSuggestionsDisabled = searchVal.trim() === '1';
  
  // Check active schedule
  const scheduleTaskExists = await runPowerShell(`Get-ScheduledTask -TaskName "WinCleanAnalyzer_AutoClean" -ErrorAction SilentlyContinue`);
  let activeSchedule = 'off';
  if (scheduleTaskExists) {
    const triggerText = await runPowerShell(`(Get-ScheduledTask -TaskName "WinCleanAnalyzer_AutoClean" -ErrorAction SilentlyContinue).Triggers.ToString()`);
    if (triggerText.includes('Weekly') || triggerText.includes('semanal') || triggerText.includes('7')) {
      activeSchedule = 'weekly';
    } else if (triggerText.includes('Daily') || triggerText.includes('diario') || triggerText.includes('1')) {
      activeSchedule = 'daily';
    } else if (triggerText.includes('Monthly') || triggerText.includes('mensual') || triggerText.includes('30')) {
      activeSchedule = 'monthly';
    } else {
      activeSchedule = 'weekly';
    }
  }
  
  return {
    telemetry: isTelemetryDisabled,
    cortana: isCortanaDisabled,
    search: isSearchSuggestionsDisabled,
    schedule: activeSchedule
  };
});
