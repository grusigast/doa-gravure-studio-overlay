const { ipcRenderer } = require('electron')
const { writeFile } = require('fs')
const bootstrap = require('bootstrap')
const $ = require('jquery')

const spinnerElement = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>'
const overlayModal = new bootstrap.Modal('#overlayModal', {backdrop: 'false' })
var tooltipList = []
var dropdownList = []

var mediaRecorder
var recordedChunks = []

window.onload = function() {
  const modal = document.getElementById('overlayModal')
  modal.addEventListener('hidden.bs.modal', event => {
    console.log('Modal hidden')
    ipcRenderer.send('modal', 'hidden')
  })
  
  modal.addEventListener('hide.bs.modal', event => {
    console.log('Modal hide')
  })

  modal.addEventListener('shown.bs.modal', event => {
    console.log('Modal shown')
  })
  
  modal.addEventListener('show.bs.modal', event => {
    console.log('Modal show')
  })

  // Enable tooltips and dropdowns
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
  dropdownList = [...dropdownElementList].map(dropdownToggleEl =>
    new bootstrap.Dropdown(dropdownToggleEl, {
      autoClose: true,
      popperConfig(defaultBsPopperConfig) {
        return { ...defaultBsPopperConfig, strategy: 'fixed' };
      }
    })
  )

  // Show modal directly if standalone mode.
  if ($('.standalone-mode-true').length > 0) {
    overlayModal.show()
  }
};

window.onclick = function(event)
{
  // Hack to fix closing dropdowns when clicking outside toggle.
  if (!event.target.classList.contains('dropdown-toggle')) {
    dropdownList.map(dropdown => dropdown.hide())
  }

  // Close all tooltips
  tooltipList.map(tooltip => tooltip.hide())
}


ipcRenderer.on('set-visibility', (e, visibility) => {
  console.log('set-visibility: ' + visibility)
  if (visibility) {
    overlayModal.show()

    // Remove transparency if not in standalone mode.
    if ($('.standalone-mode-false').length > 0) {
      document.body.style.display = null
    }

    $('.standalone-false').draggable({
      handle: ".modal-content"
    });
    $('.spinner-border').remove()
  } else {
    overlayModal.hide()
    $('.spinner-border').remove()
  }
});

ipcRenderer.on('button-pressed', (e, status) => {
  console.log('button-pressed: ' + status)
  $('.spinner-border').remove()
});


async function toggleRecord(recordBtn) {
  try {
    // Check if recording is in progress.
    if (mediaRecorder && mediaRecorder.state == 'recording') {
      console.log('Stopped recording!')
      mediaRecorder.stop()
      $(recordBtn)
        .html('<i class="bi bi-record"></i>')
        .attr('data-bs-original-title', 'Start recording')
    } else {
      // Get window source id.
      const sourceId = await ipcRenderer.invoke('videosource')

      // Show warning if no source found
      if (!sourceId) {
        mediaStream = null
        recordedChunks = []
        $(recordBtn).html('<i class="bi bi-exclamation-triangle-fill"></i>')
        bootstrap.Tooltip.getInstance('#recordBtn').setContent({'.tooltip-inner': 'Unable to find a recordable source window!'})
      } else {
        const recorderOptions = await ipcRenderer.invoke('recorderOptions')
        let stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId
            }
          }
        })

        // Setup recorder
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
        mediaRecorder.onstop = (e) => stopRecording(e, recorderOptions);

        // Start recorder and update button icon.
        recordedChunks = []
        mediaRecorder.start(0)
        $(recordBtn).html('<i class="bi bi-record-fill text-danger blink"></i>')
        bootstrap.Tooltip.getInstance('#recordBtn').setContent({'.tooltip-inner': 'Stop recording'})
      }
    }
  } catch (error) {
    console.log('Error initializing recording: ' + error)
    $(recordBtn).html('<i class="bi bi-exclamation-triangle-fill"></i>')
    bootstrap.Tooltip.getInstance('#recordBtn').setContent({'.tooltip-inner': 'Unable to initialize recording, check DevTools log'})
  }
}

async function stopRecording(e, recorderOptions) {
  const blob = new Blob(recordedChunks, {
    type: recorderOptions.mimeType
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const saveFile = await ipcRenderer.invoke('saveRecording', buffer)
  if (!saveFile) {
    $(recordBtn).html('<i class="bi bi-exclamation-triangle-fill"></i>')
    bootstrap.Tooltip.getInstance('#recordBtn').setContent({'.tooltip-inner': 'Unable to store recording, check logs'})
  } else {
    bootstrap.Tooltip.getInstance('#recordBtn').setContent({'.tooltip-inner': 'Start recording'})
  }
}

function sendKeypress(element, keys, mode, customFolder)
{
  console.log('Send: ' + keys + '  with mode: '  + mode)
  $('.spinner-border').remove()
  $(element).prepend(spinnerElement)
  ipcRenderer.send('keypress', keys, mode, customFolder)
}


function sendActionAndActivate(id, element, listId, buttonId)
{
  // Remove active class on all items in dropdownlist
  [...$('#' + listId).find('button')].map((buttonEl) => buttonEl.classList.remove('active'));

  $('#' + buttonId).prepend(spinnerElement)

  // Add active class to pressed item.
  element.classList.add('active')

  // Send action.
  sendAction(id)
}

function sendAction(id, element)
{
  console.log('Send action: '+ id)
  $(element).prepend(spinnerElement)
  ipcRenderer.send('action', id)
}

function sendSpecialAction(id)
{
  console.log('Send special action: '+ id)

  const modal = document.getElementById('overlayModal')
  modal.addEventListener('hidden.bs.modal', function performWhenClosed() {
    ipcRenderer.send('special-action', id)
    modal.removeEventListener('hidden.bs.modal', performWhenClosed)
  })
  overlayModal.hide()
}

function sendRangeValue(rangeElement, id)
{
  var value = rangeElement.value
  console.log('Send value: ' + value + ' to action: '+ id)
  ipcRenderer.send('value', value, id)
}

function sendToggle(switchElement, enableAction, disableAction)
{
  if (switchElement.checked) {
    sendAction(enableAction)
  } else {
    sendAction(disableAction)
  }
}

function setImage(keys, thumbnail)
{
  var fileName = thumbnail ? 'thumbnail://' + thumbnail : 'img/' + keys + '.jpg';
  var elements = $('.menuImage')

  for (const element of elements){
    element.src = fileName
  }
}

function resetImage()
{
  var fileName = './img/doa-gravure-studio-logo.png';
  var elements = $('.menuImage')

  for (const element of elements){
    element.src = fileName
  }
}

function toggleAccordion(collapseId)
{
  new bootstrap.Collapse('#' + collapseId).toggle()
  resetImage()
}

function toggleDropDown(element)
{
  // Toggle clicked dropdown.
  dropdownList.filter(dropdown => element === dropdown._element).map(dropdown => dropdown.toggle())

  // Hide all else.
  dropdownList.filter(dropdown => element !== dropdown._element).map(dropdown => dropdown.hide())
}

function toggleSoftEngine(switchElement)
{
  const toggles = $('.softengine-toggle')
  const toggle = [...toggles].map((toggleEl) => {
    toggleEl.checked = switchElement.checked
    toggleEl.onchange()
  });
}

function hideDefaultContent()
{
  $('#defaultContent').removeClass('show active')
}

function selectRandomScene(element, type)
{
  const sceneButtons = $('.' + type + '-button')
  const randomSceneButton = sceneButtons[Math.floor(Math.random() * sceneButtons.length)]
  $(element).prepend(spinnerElement)
  randomSceneButton.click()
}

function toggleMiniMode()
{
  const isInMiniMode = $('.modal-header').hasClass('d-none')
  console.log('Toggle mini mode: ' + isInMiniMode)

  if (isInMiniMode) {
    $('.modal-header').removeClass('d-none').addClass('d-inline')
    $('.modal-body').removeClass('d-none').addClass('d-inline')
    $('#miniModeIcon').removeClass('bi-arrows-angle-expand').addClass('bi-arrows-angle-contract')
  } else {
    $('.modal-header').removeClass('d-inline').addClass('d-none')
    $('.modal-body').removeClass('d-inline').addClass('d-none')
    $('#miniModeIcon').removeClass('bi-arrows-angle-contract').addClass('bi-arrows-angle-expand')
  }
}