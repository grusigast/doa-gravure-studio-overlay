const fs = require('fs')
const path = require('path')
const logger = require('electron-log')
const { nativeImage } = require('electron')
const { Window } = require('node-screenshots')
const { OverlayController } = require('electron-overlay-window')

module.exports = function () {

  module.takeScreenshot = function (conf, logger) {
    var screenshotLocation = conf.screenshotLocation
    if (!path.isAbsolute(conf.screenshotLocation))
    {
      // Construct absolute screenshot location from relative path.
      if (process.env.INIT_CWD) {
        screenshotLocation = path.join(process.env.INIT_CWD, conf.screenshotLocation)
      } else if (process.env.PORTABLE_EXECUTABLE_FILE) {
        screenshotLocation = path.join(path.dirname(process.env.PORTABLE_EXECUTABLE_FILE), conf.screenshotLocation)
      }
    }

    // Create dir if it does not exist.
    if (!fs.existsSync(screenshotLocation)) {
      fs.mkdirSync(screenshotLocation)
    }

    screenshotPath = path.join(screenshotLocation, new Date().getTime() + '.png')
    logger.info('Taking screenshot, saving to ' + screenshotPath + '...')

    if (conf.standalone) {
      var doaWindow = Window.all().find(({ title }) => title == conf.windowTitle )
      if (doaWindow) {
        let image = doaWindow.captureImageSync()
        fs.writeFileSync(screenshotPath, image.toPngSync(true))
      } else {
        logger.error('Could not find a window with matching title: ' + conf.windowTitle)
      }
    } else {
      pngBuffer = nativeImage.createFromBitmap(OverlayController.screenshot(), { height: OverlayController.targetBounds.height, width: OverlayController.targetBounds.width }).toPNG()    
      fs.writeFileSync(screenshotPath, pngBuffer)
    }
  }

  return module;
}()
