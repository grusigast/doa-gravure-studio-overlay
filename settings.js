const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const ejse = require('ejs-electron')
const currentVersion = process.env.npm_package_version || app.getVersion()

var settingsWindow

module.exports = function() {

    module.showSettingsWindow = function(conf, logger, saveFn, reloadFn) {
        // Create standalone window.
        settingsWindow = new BrowserWindow({
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false
            },
            fullscreenable: false,
            frame: true,
            show: false,
            transparent: false,
            resizable: true,
            center: true,
            roundedCorners: true,
            width: 600,
            height: 600,
            autoHideMenuBar: true,
            maximizable: false,
            title: 'DoA Gravure Studio Overlay - Settings',
            icon: path.join('resources', 'icon.png')
          })

        // Set data and show window.
        ejse.data({'version': currentVersion, 'conf': conf})
        settingsWindow.loadURL('file://' + __dirname + '/ui/settings.ejs')
        settingsWindow.show()

        // Handle events.
        ipcMain.on('settings', (event, data, conf) => {
            logger.info('Recieved settings event: ' + data)
            if (data == 'close') {
                settingsWindow.close()
            } else if (data == 'save') {
                saveFn(JSON.parse(conf))
                reloadFn()
                settingsWindow.close()
            } else {
                logger.error('Recieved unknown event: ' + data)
            }
        })
    }

    return module;
}()
