const ipcRenderer = require('electron').ipcRenderer;
const bootstrap = require('bootstrap')
const $ = require('jquery')

const overlayModal = new bootstrap.Modal('#overlayModal', {backdrop: 'false' })


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

  // Enable tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
};

window.onclick = function(event)
{
  // Hack to fix closing dropdowns when clicking outside toggle.
  if (!event.target.classList.contains('dropdown-toggle')) {
    closeAllDropDowns()
  }
}


ipcRenderer.on('set-visibility', (e, visibility) => {
  console.log('set-visibility: ' + visibility)
  if (visibility) {
    overlayModal.show()
    document.body.style.display = null

    $('.modal-dialog').draggable({
      handle: ".modal-content"
    });
  } else {
    overlayModal.hide()
  }
});

function sendKeypress(keys, mode)
{
  console.log('Send: ' + keys + '  with mode: '  + mode)
  ipcRenderer.send('keypress', keys, mode)
}


function sendActionAndActivate(id, element, listId)
{
  // Remove active class on all items in dropdownlist
  [...$('#' + listId).find('button')].map((buttonEl) => buttonEl.classList.remove('active'));

  // Add active class to pressed item.
  element.classList.add('active')

  // Send action.
  sendAction(id)
}

function sendAction(id)
{
  console.log('Send action: '+ id)
  ipcRenderer.send('action', id)
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

function setImage(keys)
{
  var fileName = 'img/' + keys + '.jpg';
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
  resetImage()
}

function toggleDropDown(element)
{
  // Close all dropdowns.
  closeAllDropDowns()

  // Open selected dropdown.
  new bootstrap.Dropdown(element, { autoClose : true,
    popperConfig(defaultBsPopperConfig) {
        return { ...defaultBsPopperConfig, strategy: 'fixed' };
    }
  }).toggle()
}

function toggleSoftEngine(switchElement)
{
  const toggles = $('.softengine-toggle')
  const toggle = [...toggles].map((toggleEl) => {
    toggleEl.checked = switchElement.checked
    toggleEl.onchange()
  });
}

function closeAllDropDowns()
{
  const dropdowns = $('.dropdown-toggle')
  const dropdown = [...dropdowns].map((dropdownToggleEl) => new bootstrap.Dropdown(dropdownToggleEl, {autoClose: true}).hide());
}

function hideDefaultContent()
{
  $('#defaultContent').removeClass('show active')
}

function selectRandomScene()
{
  const sceneButtons = $('.scene-button')
  const randomSceneButton = sceneButtons[Math.floor(Math.random() * sceneButtons.length)]
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