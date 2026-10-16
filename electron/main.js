const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const { fork } = require('child_process')

let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
} catch (e) {
  console.warn('[AutoUpdater] electron-updater module not found or failed to load:', e.message)
}

let mainWindow = null
let serverProcess = null
const PORT = 3000

function setupAutoUpdater() {
  if (!autoUpdater) return
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...')
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', { status: 'checking' })
    }
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', {
        status: 'available',
        version: info.version,
      })
    }
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Update not available.')
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', { status: 'up-to-date' })
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error in auto-updater:', err.message)
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', {
        status: 'error',
        message: err.message,
      })
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    console.log(`[AutoUpdater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${percent}%`)
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', {
        status: 'downloading',
        percent,
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded. Ready to install.')
    if (mainWindow) {
      mainWindow.webContents.send('updater-status', {
        status: 'downloaded',
        version: info.version,
      })
    }

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'พบการอัปเดตใหม่',
        message: `ดาวน์โหลดเวอร์ชันใหม่ (${info.version}) สำเร็จแล้ว!`,
        detail: 'ต้องการรีสตาร์ตเพื่อติดตั้งการอัปเดตตอนนี้เลยหรือไม่?',
        buttons: ['รีสตาร์ตและติดตั้งทันที', 'ไว้ภายหลัง'],
        defaultId: 0,
        cancelId: 1,
      })
      .then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  // Check for updates every 4 hours or on demand
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('Auto updater check failed:', err.message)
      })
    } catch (e) {
      // Ignore if offline or not packaged
    }
  }, 5000)
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production'

    if (isDev) {
      // In development mode, Next.js can be run separately or via npm run dev
      resolve(PORT)
      return
    }

    // In production mode, spawn Next.js start
    const serverScript = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
    serverProcess = fork(serverScript, ['start', '-p', String(PORT)], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'pipe',
    })

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString()
      console.log(`[Next.js stdout]: ${msg}`)
      if (msg.includes('Ready in') || msg.includes('started server') || msg.includes('http://localhost:3000')) {
        resolve(PORT)
      }
    })

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Next.js stderr]: ${data.toString()}`)
    })

    serverProcess.on('error', (err) => {
      console.error('[Next.js process error]:', err)
      reject(err)
    })

    // Timeout fallback resolve after 4 seconds
    setTimeout(() => {
      resolve(PORT)
    }, 4000)
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: false,
  })

  // Custom Application Menu
  const template = [
    {
      label: 'ระบบ',
      submenu: [
        {
          label: 'ตรวจหาอัปเดต (Check for Updates)',
          click: () => {
            if (app.isPackaged && autoUpdater) {
              autoUpdater.checkForUpdates().catch((err) => {
                dialog.showErrorBox('อัปเดตล้มเหลว', err.message)
              })
            } else if (!autoUpdater) {
              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'ไม่พบโมดูล Updater',
                message: 'โมดูล Auto-Updater ไม่พร้อมใช้งานในเวอร์ชันนี้',
              })
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'โหมด Development',
                message: 'Auto-Updater ใช้งานได้เมื่อแพ็กเกจเป็นไฟล์ติดตั้ง Production เท่านั้น',
              })
            }
          },
        },
        { type: 'separator' },
        { label: 'รีเฟรชหน้าเว็บ', role: 'reload' },
        { label: 'รีเฟรชแบบเคลียร์แคช', role: 'forceReload' },
        { type: 'separator' },
        { label: 'ออกจากโปรแกรม', role: 'quit' },
      ],
    },
    {
      label: 'แก้ไข',
      submenu: [
        { label: 'ตัด', role: 'cut' },
        { label: 'คัดลอก', role: 'copy' },
        { label: 'วาง', role: 'paste' },
        { label: 'เลือกทั้งหมด', role: 'selectAll' },
      ],
    },
    {
      label: 'มุมมอง',
      submenu: [
        { label: 'ขยายหน้าจอ', role: 'zoomIn' },
        { label: 'ย่อหน้าจอ', role: 'zoomOut' },
        { label: 'ขนาดปกติ', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'เต็มหน้าจอ', role: 'togglefullscreen' },
        { label: 'เปิดเครื่องมือพัฒนา (DevTools)', role: 'toggleDevTools' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  const url = `http://localhost:${PORT}`
  mainWindow.loadURL(url)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers for communication between Web and Electron
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('check-app-update', async () => {
  if (!app.isPackaged) {
    return { status: 'dev_mode', message: 'Development Mode' }
  }
  if (!autoUpdater) {
    return { status: 'error', message: 'Auto-Updater module is not loaded' }
  }
  try {
    const res = await autoUpdater.checkForUpdates()
    return { status: 'success', info: res?.updateInfo }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
})

// Lifecycle events
app.whenReady().then(async () => {
  try {
    await startNextServer()
    createMainWindow()
    if (app.isPackaged) {
      setupAutoUpdater()
    }
  } catch (error) {
    console.error('Failed to launch application:', error)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})

