const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('winCleanAPI', {
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  scanSystem: () => ipcRenderer.invoke('scan-system'),
  cleanSystem: (categories) => ipcRenderer.invoke('clean-system', categories),
  getStartupApps: () => ipcRenderer.invoke('get-startup-apps'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  applyPrivacyBoost: (toggles) => ipcRenderer.invoke('apply-privacy-boost', toggles),
  saveSchedule: (scheduleType) => ipcRenderer.invoke('save-schedule', scheduleType),
  getPrivacyState: () => ipcRenderer.invoke('get-privacy-state')
});
