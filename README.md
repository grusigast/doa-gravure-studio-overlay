# DoA Gravure Studio Overlay

DoA Gravure Studio Overlay is an overlay for DoA Gravure Studio to make it easier to select scenes and access AutoLink actions.

![Screenshot of overlay](screenshot.png?raw=true "Screenshot of overlay")

## Features
* Select DoA Gravure Studio scenes
* Perform AutoLink actions

## Limitations
* Not possible to select characters via overlay
* Not possible to select costumes via overlay
* Navigation-based actions do not work when DoA starts with controller


## Requirements
* [Node.js](https://nodejs.org/en/download/) > 16.6.0 (which comes with [npm](http://npmjs.com))
* The library used for sending key commands requires Java in your PATH


## Usage


```bash
# Clone (or download) repo 
git clone https://github.com/grusigast/doa-gravure-studio-overlay.git

# Navigate to folder
cd doa-gravure-studio-overlay

# Install dependencies
npm install

# Run the overlay
npm start
```

To display images in the overlay for each of the scenes, copy all jpg files from the `<DOAHDM Gravure Studio folder>\Scene Guide\` folder to `doa-gravure-studio-overlay\ui\img\`.


The overlay is accessible via an icon in the Windows tray or via a configurable keyboard shortcut (Ctrl+Q as default).
In the tray icon you can also:
* Toggle overlay state
* Toggle Chrome DevTools
* Reload overlay
* Quit 

## Configuration

Configuration of the overlay is done in three different JSON files;
* /conf/scenes.json
* /conf/actions.json
* /conf/conf.json


### scenes.json
Contains all scene data.

```javascript
[
    {
        "name": "Beach",                    // Scene category name.
        "id": 1,                            // Scene category ID, just a unique integer.
        "scenes": [                         // Array of scenes in category.
            {
                "name": "Beach 1",          // Scene name
                "keyMode": "combination",   // Type of keypress; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
                "keys": "F9+0"              // Keys to press. Use + as delimeter for combination and sequence keyMode.
            }
            // Additional scenes...
        ]
    }
    // Additional scene categories...
]
```


### actions.json
A button for each action will show up at the bottom of the overlay.

```javascript
[
    {
        "name": "Game",         // Action category.
        "actions": [            // Array of actions in category.
            {
                "type": "button",       // type of UI element, "button" or "dropdown".
                "icon": "eye-slash",    // Bootstrap Icon key.
                "name": "Toggle HUD",   // Name in UI.
                "keyMode": "press",     // Type of keypress; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
                "keys": "F5",           // Keys to press. Use + as delimeter for combination and sequence keyMode.
                "options": [            // For dropdown action type, array of dropdown items.
                    {
                        "name": "Slow",
                        "keyMode": "combination",
                        "keys": "F1+subtract"
                    }
                    // Additional options...
                ]
            }
            // Additional actions...
        ]
    }
    // Additional action categories...
]
```

### conf.json
Contains generic overlay configuration, available options:

```javascript
{
    "windowTitle": "DEAD OR ALIVE 5 Last Round Ver.1.10C AutoLink 19/23",           // Title of the window to display overlay window on.
    "keyDelay": 300,                  // Delay in milliseconds between overlay hide and button presses.
    "toggleOverlay": "CmdOrCtrl + Q", // Keyboard shortcut to toggle overlay.
    "reopenOverlay": false,           // Show overlay after button pressed.
    "theme": "dark"                   // Overlay theme, "dark" or "light".
}
```

## Dependencies

- [electronjs.org](https://electronjs.org) + [electron-builder](https://www.electron.build/)
- [electron-overlay-window](https://github.com/SnosMe/electron-overlay-window)
- [ejs-electron](https://github.com/bowheart/ejs-electron)
- [node-key-sender](https://github.com/garimpeiro-it/node-key-sender)
- [BootStrap](https://getbootstrap.com/) + [BootStrap Icons](https://icons.getbootstrap.com/)
- [hasbin](https://github.com/springernature/hasbin)

## Build executable
Building a portable executable file can be done with electron-builder and the following command:


```bash
# Install electron-builder
npm install -g electron-builder
# Run the dist command
npm run dist
```
The executable is generated in the `/dist/` folder.

