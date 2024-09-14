const { ipcRenderer } = require('electron')
const bootstrap = require('bootstrap')

var conf

function init(confString) {
    // Enable tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    conf = JSON.parse(confString.replaceAll('&#34;','"'))

    // Set selected items in dropdowns.
    $("#themeInput").val(conf.theme)
    $("#positionInput").val(conf.position)

    // Set values in toggles.
    $("#standaloneInput").prop('checked',conf.standalone)
    $("#logInput").prop('checked',conf.logToFile)
    $("#hideInput").prop('checked',conf.hideOverlay)
}

function closeWindow() {
    ipcRenderer.send('settings', 'close')
}

function saveSettings() {
    conf.theme = $("#themeInput").val()
    conf.position = $("#positionInput").val()

    conf.standalone = $("#standaloneInput").prop('checked')
    conf.logToFile = $("#logInput").prop('checked')
    conf.hideOverlay = $("#hideInput").prop('checked')

    conf.windowTitle = $("#windowTitleInput").val()
    conf.toggleOverlay = $("#hotkeyInput").val()
    conf.processName = $("#processNameInput").val()
    conf.keyDelay = $("#keyDelayInput").val()
    conf.screenshotLocation = $("#screenshotInput").val()
    conf.recordingLocation = $("#recordingInput").val()

    conf.memoryPollRate = $("#memoryPollRateInput").val()

    ipcRenderer.send('settings', 'save', JSON.stringify(conf))
}