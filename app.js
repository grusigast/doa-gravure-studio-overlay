const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, dialog, shell } = require('electron')
const { OverlayController } = require('electron-overlay-window')
const sendkeys = require('node-key-sender')
const ejse = require('ejs-electron')
const memoryjs = require('memoryjs')
const isElevated = require('native-is-elevated')()
const path = require('path')
const fs = require('fs')
const pino = require('pino')

var mainWindow, tray, logger
var confPath, conf, scenes, actions
var isInteractable = true

app.whenReady().then(() => {
  loadConf()
  setupLogger()
  checkElevation()
  setupKeySender()
  loadData()
  createOverlay()
  createTray()
})

app.on('window-all-closed', function () {
  app.quit()
})

function setupLogger() {
  var logPath
  if (process.env.INIT_CWD) {
    logPath = path.join(process.env.INIT_CWD, 'overlay.log')
  } else if (process.env.PORTABLE_EXECUTABLE_FILE) {
    logPath = path.join(path.dirname(process.env.PORTABLE_EXECUTABLE_FILE), 'overlay.log')
  }

  if (conf.logToFile) {
    logger = pino(pino.destination({dest: logPath, sync: true}))
    logger.info('File logger setup, conf loaded from ' + confPath + ' and logging to file ' + logPath)
  } else {
    logger = pino({transport: { target: 'pino-pretty', sync: true }})
    logger.info('Console logger setup, conf loaded from ' + confPath)
  }
}

function checkElevation() {
  if (!isElevated) {
    logger.error('DoA Gravure Studio Overlay is not running with elevated privileges, closing down!')
    dialog.showErrorBox('Not running as administrator!', 'In order for DoA Gravure Studio Overlay to send keyboard commands and perform memory injects to the DoA game process, it needs to be run with Administrator priveleges!');
    app.exit()
  }
}


function setupKeySender() {
  var jarPath = path.join(process.cwd(), 'resources', 'jar', 'key-sender.jar')
  var jrePath = path.join(process.cwd(), 'resources', 'local-jre', 'bin', 'java.exe')

  logger.info('Using jarPath: ' + jarPath + '. File exists: ' + fs.existsSync(jarPath))
  logger.info('Using jrePath: ' + jrePath + '. File exists: ' + fs.existsSync(jrePath))

  sendkeys.setOption('jarPath', jarPath)
  sendkeys.setOption('jrePath', jrePath)

  sendkeys.setOption('globalDelayPressMillisec', conf.keyDelay)
  sendkeys.setOption('startDelayMillisec ', conf.keyDelay)
}

function createTray () {
  tray = new Tray(nativeImage.createFromPath(path.join('resources', 'icon.png')))
  tray.setToolTip('DoA Gravure Studio Overlay')
  tray.setContextMenu(Menu.buildFromTemplate([
    { id: 1, label: 'Toggle overlay', click: async() => { toggleOverlay() }},
    { id: 2, label: 'Toggle DevTools', click: async() => { toggleDevTools() }},
    { type: 'separator' },
    { id: 3, label: 'Reload overlay', click: async() => { app.relaunch(); app.exit() }},
    { id: 4, label: 'Configure overlay', click: async() => { shell.openPath(confPath) }},
    { type: 'separator' },
    { id: 5, label: 'Quit', click: async() => { mainWindow.webContents.closeDevTools(); app.quit() }}
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

  // Init the overlay
  OverlayController.focusTarget()
  mainWindow.setIgnoreMouseEvents(true)
  isInteractable = false
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
    logger.info('Disabling overlay')
    OverlayController.focusTarget()
    mainWindow.setIgnoreMouseEvents(true)
    mainWindow.webContents.send('set-visibility', false)
    isInteractable = false
  } else {
    logger.info('Enabling overlay')
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.webContents.send('set-visibility', true)
    isInteractable = true
    OverlayController.activateOverlay()
  }
}

function loadConf() {
    // Construct conf file path
    if (process.env.INIT_CWD) {
      confPath = path.join(process.env.INIT_CWD, 'conf.json')
    } else if (process.env.PORTABLE_EXECUTABLE_FILE) {
      confPath = path.join(path.dirname(process.env.PORTABLE_EXECUTABLE_FILE), 'conf.json')
    }

    // Check if file exists - if not, copy default-conf.json file.
    if (!fs.existsSync(confPath)) {
      fs.copyFileSync(path.join(process.cwd(), 'resources', 'default-conf.json'), confPath)
    }

    // Load conf from file.
    conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
}

function loadData() {
  try {
    // Load overlay data.
    scenes = require('./data/scenes.json')
    actions = require('./data/actions.json')

    if (!scenes || scenes.length == 0)
    {
      logger.error('Unable to read any scene data!')
    }
  
    if (!actions || actions.length == 0)
    {
      logger.error('Unable to read any action data!')
    }

    // Set conf and data.
    ejse.data({'scenes': scenes, 'actions': actions, 'conf': conf})
  } catch (error) {
    logger.error('Error occurred when reading scene or action data: ' + error)
    ejse.data({'scenes': [], 'actions': [], 'conf': conf})
  }
}

// Recieve action event.
ipcMain.on('action', (event, data, mode) => {
  logger.info('Recieved action: ' + mode + ' with data: ' + data)

  toggleOverlay()

  if (mode == 'press') {
    sendkeys.sendKey(data).then(handleKeyPressCallback)
  } else if (mode == 'combination') {
    sendkeys.sendCombination(data.split('+')).then(handleKeyPressCallback)
  } else if (mode == 'sequence') {
    sendkeys.sendKeys(data.split('+')).then(handleKeyPressCallback)
  } else if (mode == 'inject') {
    memoryInject(data.split('|')[0], data.split('|')[1])
  } else {
    logger.error('Recieved action with unsupported mode: ' + mode)
  }
})

function handleKeyPressCallback(out, err)
{
  if (err)
  {
    logger.error('Error when sending key press: ' + err)
  }
  if (out)
  {
    logger.info('Output from keyevent: ' + out)
  }

  if (conf.reopenOverlay)
  {
    toggleOverlay()
  }
}

function memoryInject(hexAddress, value) {
  var processObject = memoryjs.openProcess(conf.processName)
  memoryjs.writeMemory(processObject.handle, parseInt(hexAddress, 16), parseFloat(value), memoryjs.FLOAT)
}