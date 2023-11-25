const ipcRenderer = require('electron').ipcRenderer;
const bootstrap = require('bootstrap')

const overlayModal = new bootstrap.Modal('#overlayModal', {backdrop: 'static' })


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
  } else {
    overlayModal.hide()
  }
});

function sendKeypress(keys, mode)
{
  console.log('Send: ' + keys + '  with mode: '  + mode)
  ipcRenderer.send('keypress', keys, mode)
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

function setImage(keys)
{
  var fileName = 'img/' + keys + '.jpg';
  var elements = document.getElementsByClassName('menuImage')

  for (const element of elements){
    element.src = fileName
  }
}

function resetImage()
{
  var fileName = './img/doa-gravure-studio-logo.png';
  var elements = document.getElementsByClassName('menuImage')

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

function closeAllDropDowns()
{
  const dropdowns = document.querySelectorAll('.dropdown-toggle')
  const dropdown = [...dropdowns].map((dropdownToggleEl) => new bootstrap.Dropdown(dropdownToggleEl, {autoClose: true}).hide());
}

function hideDefaultContent()
{
  document.getElementById('defaultContent').classList.remove('show')
  document.getElementById('defaultContent').classList.remove('active')
}