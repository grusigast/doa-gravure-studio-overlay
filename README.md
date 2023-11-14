# DoA Gravure Studio Overlay

DoA Gravure Studio Overlay is an overlay for DoA Gravure Studio to make it easier to select scenes and access AutoLink actions.

![Screenshot of overlay](screenshot.png?raw=true "Screenshot of overlay")

## Features
* Select DoA Gravure Studio scenes
* Perform AutoLink actions
* Perform memory injects

## Limitations
* The overlay will not work in Fullscreen mode! Recommend using Window mode with something like  [Borderless Gaming](https://github.com/Codeusa/Borderless-Gaming).
* Not possible to select characters via overlay (unless its possible via memory injects?)
* Not possible to select costumes via overlay (unless its possible via memory injects?)
* Navigation-based actions do not work when DoA starts with controller


## Instructions
After starting the application, the overlay is accessible via an icon in the Windows tray or via a configurable keyboard shortcut (Ctrl+Q as default).
In the tray icon you can also:
* Toggle overlay state
* Toggle Chrome DevTools
* Configure overlay
* Reload overlay
* Quit 


## Configuration
Configuration is done in the conf.json file. Available options:

```javascript
{
    "windowTitle": "DEAD OR ALIVE 5 Last Round Ver.1.10C AutoLink 19/23",           // Title of the window to display overlay window on.
    "processName": "game.exe"         // Name of DEAD OR ALIVE 5 process, used for memory injections.
    "keyDelay": 300,                  // Delay in milliseconds between overlay hide and button presses.
    "toggleOverlay": "CmdOrCtrl + Q", // Keyboard shortcut to toggle overlay.
    "reopenOverlay": false,           // Show overlay after button pressed.
    "theme": "dark",                  // Overlay theme, "dark" or "light".
    "logToFile": false                // Enable or disable logging to file overlay.log.   
}
```


## Requirements for development
* [Node.js](https://nodejs.org/en/download/) > 16.6.0 (which comes with [npm](http://npmjs.com))
* [node-gyp](https://github.com/nodejs/node-gyp)
* The library used for sending key commands, [node-key-sender](https://github.com/garimpeiro-it/node-key-sender), requires a JDK/JRE in order to call a JAR-file to execute the keyboard commands.
** The necessary files can be manually copied to `resources/` or automatically with the `npm run setup` command. The `setup` command will copy the necessary files from `%JAVA_HOME%` and `node_modules/node-key-sender/jar`
** The JDK is copied to `resources/local-jdk/` and the `key-sender.jar` is copied to `resources/jar/`


## Developing


```bash
# Clone (or download) repo 
git clone https://github.com/grusigast/doa-gravure-studio-overlay.git

# Navigate to folder
cd doa-gravure-studio-overlay

# Install dependencies
npm install

# Copy JDK from %JAVA_HOME% and key-sender jar
npm run setup

# Run the overlay
npm start
```

To display images in the overlay for each of the scenes, copy all jpg files from the `<DOAHDM Gravure Studio folder>\Scene Guide\` folder to `doa-gravure-studio-overlay\ui\img\`.


## Scenes and actions

Configuration of the overlay is done in three different JSON files;
* /data/scenes.json
* /data/actions.json


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
                "mode": "combination",   // Type of keypress; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
                "data": "F9+0"              // Keys to press. Use + as delimeter for combination and sequence keyMode.
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

            // Key press action.
            {
                "type": "button",       // Type of UI element, "button" or "dropdown".
                "icon": "eye-slash",    // Bootstrap Icon key.
                "name": "Toggle HUD",   // Name in UI.
                "mode": "press",       // Type of action; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
                "data": "F5",           // Keys to press. Use + as delimeter for combination and sequence keyMode.
                "options": [            // For dropdown action type, array of dropdown items.
                    {
                        "name": "Slow",
                        "mode": "combination",
                        "data": "F1+subtract"
                    }
                    // Additional options...
                ]
            },

            // Memory inject action.
            {
                "type": "button",       // Type of UI element, "button" or "dropdown".
                "icon": "eye-slash",    // Bootstrap Icon key.
                "name": "Toggle HUD",   // Name in UI.
                "mode": "inject",       // Type of action; inject for memory injections.
                "data": "12559D10|-1.0",// Data to send, format: memoryAddressHex|value
            }
        ]
    }
    // Additional action categories...
]
```



## Dependencies

- [electronjs.org](https://electronjs.org) + [electron-builder](https://www.electron.build/)
- [electron-overlay-window](https://github.com/SnosMe/electron-overlay-window)
- [electron-log](https://github.com/megahertz/electron-log)
- [ejs-electron](https://github.com/bowheart/ejs-electron)
- [node-key-sender](https://github.com/garimpeiro-it/node-key-sender)
- [BootStrap](https://getbootstrap.com/) + [BootStrap Icons](https://icons.getbootstrap.com/)
- [memoryjs](https://github.com/Rob--/memoryjs)
- [native-is-elevated](https://github.com/arkon/native-is-elevated)

## Build executable
Building a portable executable file can be done with electron-builder and the following command:


```bash
# Install electron-builder
npm install -g electron-builder
# Run the dist command
npm run dist
```
The executable is generated in the `/dist/` folder.

