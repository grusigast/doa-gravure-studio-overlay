const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, dialog, shell } = require('electron')
const { OverlayController } = require('electron-overlay-window')
const sendkeys = require('node-key-sender')
const ejse = require('ejs-electron')
const memoryjs = require('memoryjs')
const isElevated = require('native-is-elevated')()
const path = require('path')
const fs = require('fs')
const logger = require('electron-log')
const { listOpenWindows } = require('@josephuspaye/list-open-windows')
const { currentVersion } = require('./package.json');

var mainWindow, tray
var confPath, conf, scenes, actions
var isInteractable = true

app.whenReady().then(() => {
  loadConf()
  setupLogger()
  checkOtherInstance()
  checkElevation()
  setupKeySender()
  loadData()
  createOverlay()
  createTray()
})

app.on('window-all-closed', function () {
  app.releaseSingleInstanceLock()
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
    logger.transports.file.level = true;
    logger.transports.console.level = false;
    logger.transports.file.resolvePathFn = () => logPath
    logger.transports.file.fileName = 'overlay.log'
    logger.info('File logger setup, conf loaded from ' + confPath + ' and logging to file ' + logPath)
  } else {
    logger.transports.file.level = false;
    logger.transports.console.level = true;
    logger.transports.console.useStyles = true
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

function checkOtherInstance() {
  var isLocked = app.requestSingleInstanceLock()
  if (!isLocked) {
    logger.error('Another instance of the overlay is running, closing down!')
    dialog.showErrorBox('Another instance is running!', 'Another instance of DoA Gravure Studio Overlay is running.\nPlease close that instance, either via tray icon menu Quit or via Task manager, and try starting again!');
    app.exit()
  }
}

function checkWindowOpen() {
  var windows = listOpenWindows()
  var match = windows.find((window) => window.caption == conf.windowTitle)

  if (!match) {
    logger.error('Unable to find a window with title "' + conf.windowTitle + '", cannot show overlay.')
    dialog.showErrorBox('Could not find target window!', 'Unable to find a window with title "' + conf.windowTitle + '"\nNavigate to the DoA Main menu or check the windowTitle configuration in the conf.json file and restart the overlay.');
  }
}

function setupKeySender() {
  var jarPath = path.join(process.cwd(), 'resources', 'jar', 'key-sender.jar')
  var jrePath = path.join(process.cwd(), 'resources', 'local-jre', 'bin', 'java.exe')

  logger.info('Using jarPath: ' + jarPath + '. File exists: ' + fs.existsSync(jarPath))
  logger.info('Using jrePath: ' + jrePath + '. File exists: ' + fs.existsSync(jrePath))

  sendkeys.setOption('jarPath', jarPath)
  sendkeys.setOption('jrePath', jrePath)
}

function showAboutDialog()
{
  var clicked = dialog.showMessageBoxSync({
    type: 'info',
    title: 'About Gravure Studio Overlay',
    message: 'DoA Gravure Studio Overlay - version ' + currentVersion,
    detail: 'This version of Gravure Studio Overlay is compatible with Gravure Studio ' +  scenes.gravurestudioversion + '\n\nGravure Studio is developed by Holden McClure.',
    buttons: ['Open overlay repo on github', 'Holden McClure on Twitter', 'Gravure Studio Patreon', 'Gravure Studio Discord', 'Close'],
    cancelId: 4
  })

  if (clicked == 0) {
    shell.openExternal('https://github.com/grusigast/doa-gravure-studio-overlay')
  } else if (clicked == 1) {
    shell.openExternal('https://twitter.com/holden_mcclure')
  } else if (clicked == 2) {
    shell.openExternal('https://www.patreon.com/doahdm')
  } else if (clicked == 3) {
    shell.openExternal('http://discord.gg/EsUF6pAgCz')
  }
}

function createTray () {
  tray = new Tray(nativeImage.createFromPath(path.join('resources', 'icon.png')))
  tray.setToolTip('DoA Gravure Studio Overlay')
  tray.setContextMenu(Menu.buildFromTemplate([
    { id: 1, label: 'Start DoA', click: async() => { shell.openExternal('steam://rungameid/311730') }},
    { type: 'separator' },
    { id: 2, label: 'Toggle overlay', click: async() => { toggleOverlay(true) }},
    { id: 3, label: 'Toggle DevTools', click: async() => { toggleDevTools() }},
    { type: 'separator' },
    { id: 4, label: 'Reload overlay', click: async() => { reload() }},
    { id: 5, label: 'Configure overlay', click: async() => { shell.openPath(confPath) }},
    { type: 'separator' },
    { id: 7, label: 'About Gravure Studio', click: async() => { showAboutDialog() }},
    { id: 8, label: 'Quit', click: async() => { mainWindow.webContents.closeDevTools(); app.quit() }}
  ]))
}

function reload() {
  logger.info('Reloading overlay conf...')

  // Unregister shortcut and reset logging.
  globalShortcut.unregisterAll()
  logger.transports.file.level = false;
  logger.transports.console.level = false;

  // Load conf and data again.
  loadConf()
  setupLogger()
  loadData()
  mainWindow.webContents.reloadIgnoringCache()

  createOverlay(true)
}

function createOverlay (reload) {
  if (!reload) {
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
  }

  // add data and load menu.ejs
  mainWindow.loadURL('file://' + __dirname + '/ui/menu.ejs')

  // Register overlay shortcut.
  globalShortcut.register(conf.toggleOverlay, () => toggleOverlay(true))

  if (!reload) {
    // Attach to process with configured windowTitle.
    OverlayController.attachByTitle(mainWindow, conf.windowTitle)
  }

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

function toggleOverlay(toggleVisibiliy) {
  checkWindowOpen()

  if (isInteractable) {
    disableOverlay(toggleVisibiliy)
  } else {
    enableOverlay(toggleVisibiliy)
  }
}

function disableOverlay(hide)
{
  logger.info('Disabling overlay...')
  OverlayController.focusTarget()
  mainWindow.setIgnoreMouseEvents(true)

  if (hide) {
    logger.info('Hiding overlay...')
    mainWindow.webContents.send('set-visibility', false)
  }

  isInteractable = false

  // Workaround for arrow keys not functioning after overlay shown
  sendkeys.sendKey('control').then(() => {})
}

function enableOverlay(show)
{
  logger.info('Enabling overlay...')
  mainWindow.setIgnoreMouseEvents(false)

  if (show) {
    logger.info('Showing overlay...')
    mainWindow.webContents.send('set-visibility', true)
  }

  isInteractable = true
  OverlayController.activateOverlay()
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
    conf = JSON.parse(fs.readFileSync(confPath, 'utf8'))
}

function loadData() {
  try {
    // Check executable path first.
    if (process.env.INIT_CWD) {
      basePath = process.env.INIT_CWD
    } else if (process.env.PORTABLE_EXECUTABLE_FILE) {
      basePath = path.dirname(process.env.PORTABLE_EXECUTABLE_FILE)
    }
    actionsFile = path.join(basePath, 'actions.json')
    scenesFile = path.join(basePath, 'scenes.json')

    // If actions file not present in executable path, load from resources
    if (!fs.existsSync(actionsFile)) {
      actionsFile = path.join(process.cwd(), 'resources', 'actions.json')
    }

    // If scenes file not present in executable path, load from resources
    if (!fs.existsSync(scenesFile)) {
      scenesFile = path.join(process.cwd(), 'resources', 'scenes.json')
    }
    
    scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'))
    actions = JSON.parse(fs.readFileSync(actionsFile, 'utf8'))

    if (!scenes || scenes.scenes.length == 0)
    {
      logger.error('Unable to read any scene data!')
    }
  
    if (!actions || actions.length == 0)
    {
      logger.error('Unable to read any action data!')
    }

    // Set conf and data.
    ejse.data({'scenes': scenes.scenes, 'actions': actions, 'conf': conf})
  } catch (error) {
    logger.error('Error occurred when reading scene or action data: ' + error)
    ejse.data({'scenes': [], 'actions': [], 'conf': conf})
  }
}

// Recieve modal event.
ipcMain.on('modal', (event, data) => {
  logger.info('Recieved modal event: ' + data)
  if (data == 'hidden' && isInteractable) {
    disableOverlay(true)
  }
})

// Recieve KeyPress event.
ipcMain.on('keypress', (event, keys, mode) => {
  logger.info('Recieved keypress: ' + keys + ' with mode: ' + mode)
  handleKeyPress(keys, mode)
})

// Recieve Action event.
ipcMain.on('action', (event, id) => {
  logger.info('Recieved action: ' + id)

  var action = actions.find((action) => action.id === id)
  if (action) {
    if (action.action == 'keypress') {
      handleKeyPress(action.data, action.mode, action.globalDelayPressMillisec, action.startDelayMillisec)
    } else if (action.action == 'inject') {
      if (action.mode == 'multiple') {
          action.injects.forEach(element => {
            handleMemoryInject(element.address, element.value)
          });
        
      } else {
        handleMemoryInject(action.address, action.value)
      }
    } else if (action.action == 'inject-pointer') {

      if (action.mode == 'multiple') {
        action.injects.forEach(element => {
          handleMemoryInjectPointer(element.address, element.offset, element.value)
        });
      }
    } else {
      logger.error('Recieved unknown action: ' + action.action + ' for id: ' + id)
    }
  } else {
    logger.error('Recieved unknown action id: ' + id)
  }
})


// Recieve Value event.
ipcMain.on('value', (event, value, id) => {
  logger.info('Recieved value: ' + value + ' for id: ' + id)

  var action = actions.find((action) => action.id === id)
  if (action) {
    if (action.mode == 'range') {

      var min = parseFloat(action.min)
      var max = parseFloat(action.max)
      var tot = Math.abs(max - min)
      var relativeValue = min + ((parseFloat(value)/100) * parseFloat(tot))

      if (action.action == 'inject-pointer') {
        handleMemoryInjectPointer(action.address, action.offset, relativeValue.toFixed(2))
      } else if (action.action == 'inject') {
        handleMemoryInject(action.address, relativeValue.toFixed(2))
      } else {
        logger.error('Recieved unknown action: ' + action.action + ' for id: ' + id)
      }
    } else {
      logger.error('Recieved unknown mode: ' + action.mode + ' for id: ' + id)
    }
  } else {
    logger.error('Recieved unknown action id: ' + id)
  }
})

function handleMemoryInject(injectAddress, value) {
  logger.info('Injecting data: ' + value + ' to address: ' + injectAddress)

  try
  {
    if (value) {

      processObject = memoryjs.openProcess(conf.processName)
      var baseAddress = processObject.modBaseAddr
      var address = baseAddress + parseInt(injectAddress, 16)

      memoryjs.writeMemory(processObject.handle, address, parseFloat(value), memoryjs.FLOAT)
      memoryjs.closeProcess(processObject.handle)
    } else {
      logger.error('No value to inject!')
    }
  } catch (error) {
    logger.error('Unable to inject value to memory: ' + error)
  }

}

function handleMemoryInjectPointer(injectAddress, offset, value) {
  try
  {
    if (value) {

      processObject = memoryjs.openProcess(conf.processName)

      var baseAddress = processObject.modBaseAddr
      var ptrAddress = baseAddress + parseInt(injectAddress, 16) 
      var actualAddress = memoryjs.readMemory(processObject.handle, ptrAddress, memoryjs.DWORD) + parseInt(offset, 16)
      logger.info('Injecting data: ' + value + ' to pointer address: ' + injectAddress + ' with offset: ' + offset + '  Resulting address: ' + actualAddress) 

      memoryjs.writeMemory(processObject.handle, actualAddress, parseFloat(value), memoryjs.FLOAT)
      memoryjs.closeProcess(processObject.handle)
    } else {
      logger.error('No value to inject!')
    }
  } catch (error) {
    logger.error('Unable to inject value to memory: ' + error)
  }
}

function handleKeyPress(keys, mode, globalDelay, startDelay) {
  logger.info('Performing keypress: ' + keys + ' with mode: ' + mode)

  if (globalDelay) {
    sendkeys.setOption('globalDelayPressMillisec', globalDelay)
  } else {
    sendkeys.setOption('globalDelayPressMillisec', conf.keyDelay)
  }

  if (startDelay) {
    sendkeys.setOption('startDelayMillisec', startDelay)
  } else {
    sendkeys.setOption('startDelayMillisec', conf.keyDelay)
  }

  toggleOverlay(false)
  if (mode == 'press') {
    sendkeys.sendKey(keys).then(handleKeyPressCallback)
  } else if (mode == 'combination') {
    sendkeys.sendCombination(keys.split('+')).then(handleKeyPressCallback)
  } else if (mode == 'sequence') {
    sendkeys.sendKeys(keys.split('+')).then(handleKeyPressCallback)
  } else {
    logger.error('Recieved keypress action with unsupported mode: ' + mode)
  }
}

function handleKeyPressCallback(out, err) {
  if (err) {
    logger.error('Error when sending key press: ' + err)
    mainWindow.webContents.send('button-pressed', false)
  } else {
    mainWindow.webContents.send('button-pressed', true)
  }

  if (out)
  {
    logger.info('Output from keyevent: ' + out)
  }

  if (conf.hideOverlay) {
    disableOverlay(true)
  } else {
    toggleOverlay(false)
  }
}