const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('set-visibility', (e, visibility) => {
  console.log('set-visibility: ' + visibility)
  
  if (document.body.style.display) {
    document.getElementById('menuImage').setAttribute('src', 'img/logo.png')
    document.body.style.display = null
  } else {
    document.body.style.display = 'none'
  }
});

function sendAction(data, mode)
{
  console.log('Send: ' + data + '  with mode: '  + mode)
  ipcRenderer.send("action", data, mode)
}

function setImage(keys)
{
  var fileName = 'img/' + keys + '.jpg';
  document.getElementById('menuImage').setAttribute('src', fileName)
}
