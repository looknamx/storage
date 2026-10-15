const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkAppUpdate: () => ipcRenderer.invoke('check-app-update'),
  onUpdaterStatus: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('updater-status', subscription)
    return () => ipcRenderer.removeListener('updater-status', subscription)
  },
})

