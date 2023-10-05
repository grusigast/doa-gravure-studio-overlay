const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron')
const { OverlayController } = require('electron-overlay-window')
const sendkeys = require('node-key-sender')
const ejse = require('ejs-electron')
const hasbin = require('hasbin')
const memoryjs = require('memoryjs')

var mainWindow, tray
var conf, scenes, actions
var isInteractable = true

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
    mainWindow.webContents.send('set-visibility', false)
    isInteractable = false
  } else {
    mainWindow.setIgnoreMouseEvents(false)
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

// Recieve action event.
ipcMain.on('action', (event, data, mode) => {
  console.log('Handle action: ' + mode + ' with data: ' + data)

  sendkeys.setOption('globalDelayPressMillisec', conf.keyDelay)
  sendkeys.setOption('startDelayMillisec ', conf.keyDelay * 2)

  toggleOverlay()

  if (mode == 'press') {
    OverlayController.focusTarget()
    sendkeys.setOption('globalDelayPressMillisec', 100)

    sendkeys.sendKey(data).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else if (mode == 'combination') {
    sendkeys.sendCombination(data.split('+')).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else if (mode == 'sequence') {
    sendkeys.sendKeys(data.split('+')).then((out, err) => {
      if (conf.reopenOverlay)
      {
        toggleOverlay()
      }
    })
  } else if (mode == 'inject') {
    memoryInject(data.split('|')[0], data.split('|')[1])
  } else {
    console.log('Invalid mode: ' + mode)
  }
})

function memoryInject(hexAddress, value) {
  var processObject = memoryjs.openProcess(conf.processName)
  memoryjs.writeMemory(processObject.handle, parseInt(hexAddress, 16), parseFloat(value), memoryjs.FLOAT)
}