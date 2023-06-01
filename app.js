const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron')
const { OverlayController } = require('electron-overlay-window')
const sendkeys = require('node-key-sender')
const ejse = require('ejs-electron')
const hasbin = require('hasbin')

var mainWindow, tray
var conf, scenes, actions
var isInteractable = false

app.whenReady().then(() => {
  checkJava()
  loadConf()
  createOverlay()
  createTray()
})

app.on('window-all-closed', function () {
  app.quit()
})

async function checkJava()
{
  hasbin('java', function (isAvailable) {
    if (!isAvailable) {
      console.log('DoA Gravure Studio Overlay requires Java on your windows PATH!')
      dialog.showErrorBox('Could not locate Java!', 'DoA Gravure Studio Overlay requires Java on your Windows PATH!');
      app.exit()
    }
  });
}

function createTray () {
  tray = new Tray(nativeImage.createFromPath('icon.png'))
  tray.setToolTip('DoA Gravure Studio Overlay')
  tray.setContextMenu(Menu.buildFromTemplate([
    { id: 1, label: 'Toggle overlay', click: async() => { toggleOverlay() }},
    { id: 2, label: 'Toggle DevTools', click: async() => { toggleDevTools() }},
    { type: 'separator' },
    { id: 3, label: 'Reload overlay', click: async() => { app.relaunch(); app.exit() }},
    { type: 'separator' },
    { id: 4, label: 'Quit', click: async() => { mainWindow.webContents.closeDevTools(); app.quit() }}
  ]))
}

function createOverlay () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    fullscreenable: true,
    skipTaskbar: true,
    frame: false,
    show: false,
    transparent: true,
    resizable: true
  })

  // add data and load menu.ejs
  mainWindow.loadURL('file://' + __dirname + '/ui/menu.ejs')

  // Register overlay shortcut.
  globalShortcut.register(conf.toggleOverlay, toggleOverlay)

  // Attach to process with configured windowTitle.
  OverlayController.attachByTitle(mainWindow, conf.windowTitle)

  // Enable the overlay
  toggleOverlay()
}

function toggleDevTools() {
  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools()
  } else {
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: false })
  }
}

function toggleOverlay () {
  if (isInteractable) {
    OverlayController.focusTarget()
    mainWindow.setIgnoreMouseEvents(true)
    mainWindow.webContents.send('focus-change', false)
    mainWindow.webContents.send('set-visibility', false)
    isInteractable = false
  } else {
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.webContents.send('focus-change', true)
    mainWindow.webContents.send('set-visibility', true)
    isInteractable = true
    OverlayController.activateOverlay()
  }
}

function loadConf() {
  // Load overlay conf and data.
  conf = require('./conf/conf.json')
  scenes = require('./conf/scenes.json')
  actions = require('./conf/actions.json')

  ejse.data({'scenes': scenes, 'actions': actions, 'conf': conf})
}

// Recieve key press event.
ipcMain.on('pressKey', (event, keys, keyMode) => {
  console.log('Press keys: ' + keys + ' with mode: ' + keyMode)

  sendkeys.setOption('globalDelayPressMillisec', conf.keyDelay)
  sendkeys.setOption('startDelayMillisec ', conf.keyDelay * 2)

  toggleOverlay()

  if (keyMode == 'press') {
    overlayWindow.focusTarget()
    sendkeys.setOption('globalDelayPressMillisec', 100)

    sendkeys.sendKey(keys).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else if (keyMode == 'combination') {
    sendkeys.sendCombination(keys.split('+')).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else if (keyMode == 'sequence') {
    sendkeys.sendKeys(keys.split('+')).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else {
    console.log('Invalid keyMode: ' + keyMode)
  }
})