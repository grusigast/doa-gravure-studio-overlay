const memoryjs = require('memoryjs')

module.exports = function () {

  var keepInjections = new Map([])
  var logger
  var processObject
  var conf
  var currentlyInjecting = false

  module.init = function (confObj, log) {
    logger = log
    conf = confObj

    if (conf.memoryPollRate !== '-1') {
      setInterval(reinjectKeepValues, conf.memoryPollRate)
    } else {
      logger.info('Memory polling disabled.')
    }
  }

  module.inject = function (inject, value) {

    if (inject.action == 'inject') {

      // Multiple
      if (inject.mode == 'multiple') {
        inject.injects.forEach(element => {
          if (element.mode == 'pointer') {
            handleMemoryInjectPointer(element, inject.keep)
          } else {
            handleMemoryInject(element, inject.keep)
          }
        });

      // Range
      } else if (inject.mode == 'range') {
        var min = parseFloat(inject.min)
        var max = parseFloat(inject.max)
        var tot = Math.abs(max - min)
        var relativeValue = min + ((parseFloat(value)/100) * parseFloat(tot))
        inject.value = relativeValue.toFixed(2)
  
        if (inject.action == 'inject-pointer') {
          handleMemoryInjectPointer(inject, inject.keep)
        } else if (inject.action == 'inject') {
          handleMemoryInject(inject, inject.keep)
        } else {
          logger.error('Recieved unknown action: ' + inject.action + ' for id: ' + id)
        }

      // Regular
      } else {
        handleMemoryInject(inject, inject.keep)
      }
    } else if (inject.action == 'inject-pointer') {

      // Multiple
      if (inject.mode == 'multiple') {
        inject.injects.forEach(element => {
          handleMemoryInjectPointer(element, inject.keep)
        });

      // Range
      } else if (inject.mode == 'range') {

        var min = parseFloat(inject.min)
        var max = parseFloat(inject.max)
        var tot = Math.abs(max - min)
        var relativeValue = min + ((parseFloat(value)/100) * parseFloat(tot))
        inject.value = relativeValue.toFixed(2)
  
        if (inject.action == 'inject-pointer') {
          handleMemoryInjectPointer(inject, inject.keep)
        } else if (inject.action == 'inject') {
          handleMemoryInject(inject, inject.keep)
        } else {
          logger.error('Recieved unknown action: ' + inject.action + ' for id: ' + id)
        }
    
      // Regular
      } else {
        handleMemoryInjectPointer(inject, inject.keep)
      }
    } else {
      logger.error('Unknown inject action: ' + inject.action)
    }
  }

  module.setAutolinkFolder = function(value)
  {
    var processObject = memoryjs.openProcess(conf.processName)

    var startAdress = parseInt('100B13DC', 16)
    var chars = value.length
    
    for (let index = 0; index < chars; index++) {
      var char = value.charAt(index)
      var charValue = char.charCodeAt(0)
      var currentAddress = startAdress + (index * 2)
      
      memoryjs.virtualProtectEx(processObject.handle, currentAddress, 1, memoryjs.PAGE_READWRITE)
      memoryjs.writeMemory(processObject.handle, currentAddress, charValue, memoryjs.UCHAR)
      memoryjs.virtualProtectEx(processObject.handle, currentAddress, 1, memoryjs.PAGE_READONLY)
    }

    memoryjs.closeProcess(processObject.handle)
  }

  function reinjectKeepValues() {
    try {
      if (keepInjections.size > 0 && !currentlyInjecting) { 
        processObject = memoryjs.openProcess(conf.processName)
        for (const [key, value] of keepInjections) {
          memoryjs.writeMemory(processObject.handle, key, value, memoryjs.FLOAT)
        }
        memoryjs.closeProcess(processObject.handle)
      }
    } catch (error) {
      // ignore errors.
    }
  }

  function handleMemoryInject(inject, keep) {
    currentlyInjecting = true

    var injectAddress = inject.address
    var value = inject.value
    var valueType = inject.valueType

    try {
      if (value) {

        processObject = memoryjs.openProcess(conf.processName)
        var baseAddress = processObject.modBaseAddr
        var address = baseAddress + parseInt(injectAddress, 16)

        if (valueType == 'add') {
          var existingValue = memoryjs.readMemory(processObject.handle, address, memoryjs.FLOAT)
          var newValue = parseFloat(existingValue) + parseFloat(value)

          logger.info('Add ' + value + ' to existing value: ' + existingValue)

          value = newValue
        }

        logger.info('Injecting data: ' + value + ' to address: ' + injectAddress)

        memoryjs.writeMemory(processObject.handle, address, parseFloat(value), memoryjs.FLOAT)

        if (keep) {
          logger.info('Keeping value: ' + parseFloat(value) + ' for address: ' + address)
          keepInjections.set(address, parseFloat(value))
        }

        memoryjs.closeProcess(processObject.handle)
      } else {
        logger.error('No value to inject!')
      }
    } catch (error) {
      logger.error('Unable to inject value to memory: ' + error)
    }
    currentlyInjecting = false
  }

  function handleMemoryInjectPointer(inject, keep) {
    currentlyInjecting = true

    var injectAddress = inject.address
    var offset = inject.offset
    var offsets = inject.offsets
    var value = inject.value
    var valueType = inject.valueType

    try {
      if (value) {

        processObject = memoryjs.openProcess(conf.processName)

        var baseAddress = processObject.modBaseAddr
        var ptrAddress = baseAddress + parseInt(injectAddress, 16)
        var actualAddress

        if (offsets) {
          actualAddress = memoryjs.readMemory(processObject.handle, ptrAddress, memoryjs.DWORD)
          for (var i = 0; i < offsets.length - 1; i++) {
            var offset = offsets[i]
            increasedPtr = actualAddress + parseInt(offset, 16)
            actualAddress = memoryjs.readMemory(processObject.handle, increasedPtr, memoryjs.DWORD)
          }
          actualAddress = actualAddress + + parseInt(offsets[offsets.length - 1], 16)
          logger.info('Injecting data: ' + value + ' to pointer address: ' + injectAddress + ' with multiple offsets: [' + offsets + ']  Resulting address: ' + actualAddress.toString(16).toUpperCase())
        } else {
          actualAddress = memoryjs.readMemory(processObject.handle, ptrAddress, memoryjs.DWORD) + parseInt(offset, 16)
          logger.info('Injecting data: ' + value + ' to pointer address: ' + injectAddress + ' with offset: ' + offset + '  Resulting address: ' + actualAddress.toString(16).toUpperCase())
        }

        if (valueType == 'add') {
          var existingValue = memoryjs.readMemory(processObject.handle, actualAddress, memoryjs.FLOAT)
          var newValue = parseFloat(existingValue) + parseFloat(value)

          logger.info('Add ' + value + ' to existing value: ' + existingValue)

          value = newValue
        }

        if (keep) {
          logger.info('Keeping value: ' + parseFloat(value) + ' for address: ' + actualAddress)
          keepInjections.set(actualAddress, parseFloat(value))
        }

        memoryjs.writeMemory(processObject.handle, actualAddress, parseFloat(value), memoryjs.FLOAT)
        memoryjs.closeProcess(processObject.handle)
      } else {
        logger.error('No value to inject!')
      }
    } catch (error) {
      logger.error('Unable to inject value to memory: ' + error)
    }

    currentlyInjecting = false
  }

  return module;
}()
