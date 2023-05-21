const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('set-visibility', (e, visibility) => {
  console.log('set-visibility: ' + visibility)
  
  if (document.body.style.display) {
    document.body.style.display = null
  } else {
    document.body.style.display = 'none'
  }
});

function sendKeyPress(keys, keyMode)
{
  console.log('Send key press: ' + keys + '  with mode: '  + keyMode)
  ipcRenderer.send("pressKey", keys, keyMode);
}

function setImage(keys)
{
  var fileName = 'img/' + keys + '.jpg';
  document.getElementById('menuImage').setAttribute('src', fileName)
}
