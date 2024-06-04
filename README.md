# DoA Gravure Studio Overlay

DoA Gravure Studio Overlay is an overlay for DoA Gravure Studio to make it easier to select scenes and access AutoLink actions.

![Screenshot of overlay](screenshot.png?raw=true "Screenshot of overlay")

## Features
* Select DoA Gravure Studio scenes
* Perform AutoLink actions
* Perform memory injects

## Limitations
* Not possible to select characters via overlay (unless its possible via memory injects?)
* Not possible to select costumes via overlay (unless its possible via memory injects?)
* Navigation-based actions do not work when DoA starts with controller


## Instructions

Download the latest overlay version from the [releases page](https://github.com/grusigast/doa-gravure-studio-overlay/releases) and place in the `/Gravure Studio Overlay/` folder of the unzipped Gravure Studio release package.

After starting the application as Administrator, the overlay is accessible via an icon in the Windows tray or via a configurable keyboard shortcut (Ctrl+Q as default).
In the tray icon you can also:
* Start Dead or Alive 5 via Steam
* Toggle overlay state
* Toggle Chrome DevTools
* Reload overlay
  * Note that an updated windowTitle requires overlay to be restarted!
* Configure overlay
  * conf.json is opened by default editor.
* Check for updates
* Show overlay information
* Quit overlay

To get the overlay working properly in fullscreen mode, set the following property in the `ReShade.ini` file in the DoA installation folder:
```properties
ForceWindowed=1
```

## Configuration
Configuration is done in the conf.json file. Available options:

```javascript
{
    "windowTitle": "DEAD OR ALIVE 5 Last Round Ver.1.10C AutoLink 19/23",           // Title of the window to display overlay window on.
    "processName": "game.exe"         // Name of DEAD OR ALIVE 5 process, used for memory injections.
    "keyDelay": 100,                  // Delay in milliseconds between overlay hide and button presses.
    "toggleOverlay": "Ctrl + Q",      // Keyboard shortcut to toggle overlay.
    "hideOverlay": false,             // Hide overlay after button pressed.
    "theme": "dark",                  // Overlay theme, "dark" or "light".
    "logToFile": false,               // Enable or disable logging to file overlay.log.
    "position": "left",               // Overlay position; "left", "middle" or "right".
    "screenshotLocation": "./screenshots/",  // Location where screenshots will be stored.
    "keyStuckFix": true               // Set to true to attempt to fix F1-F12 keys being stuck after selecting scene.
}
```


## Requirements for development
* [Node.js](https://nodejs.org/en/download/) > 16.6.0 (which comes with [npm](http://npmjs.com))
* [node-gyp](https://github.com/nodejs/node-gyp)
* The library used for sending key commands, [node-key-sender](https://github.com/garimpeiro-it/node-key-sender), requires a JDK/JRE in order to call a JAR-file to execute the keyboard commands.
  * The necessary files can be manually copied to `resources/` or automatically with the `npm run setup` command. The `setup` command will copy the necessary files from `%JAVA_HOME%` and `node_modules/node-key-sender/jar`
  * The JDK is copied to `resources/local-jdk/` and the `key-sender.jar` is copied to `resources/jar/`


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


## Scenes, actions and SoftEngine

Configuration of the overlay is done in three different JSON files;
* /resources/scenes.json
* /resources/actions.json
* /resources/softengine.json

These files can also be placed in the workspace root or executable file folder, and will be read from there instead.

### scenes.json
Contains all scene data.

```javascript
{
    "gravurestudioversion": "1.4",              // Currently supported Gravure Studio version
    "scenes": [
        {
            "name": "Beach",                    // Scene category name.
            "id": 1,                            // Scene category ID, just a unique integer.
            "scenes": [                         // Array of scenes in category.
                {
                    "name": "Beach 1",          // Scene name
                    "mode": "combination",      // Type of keypress; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
                    "data": "F9+0"              // Keys to press. Use + as delimeter for combination and sequence keyMode.
                    "customfolder": "Custom-Paradise",  // [Optional] Custom AutoLink folder to execute hotkey in. Must be 15 characters.
                    "thumbnail": "thumbs/beach1.jpg"    // [Optional] Relative path to thumbnail. Will be used instead of bundled thumbnail.
                }
                // Additional scenes...
            ]
        }
        // Additional scene categories...
    ],
    "poses": [
        // Same structure as for scenes. Will be separated into own tab in overlay.
    ]
}
```


### actions.json
```javascript
[
    
    // Key press action example
    {
        "id": "speed-slow",     // ID of action.
        "action": "keypress",   // Type of action; "keypress" in this case.
        "mode": "combination",  // Type of keypress; "press" for single press, "combination" for key combinations, "sequence" for sequence of keypresses.
        "data": "F1+subtract"   // Keys to press. Use + as delimeter for combination and sequence mode.
    },

    // Memory inject example
    {
        "id": "camera-x-pan",   // ID of action.
        "action": "inject",     // Type of action; "inject" for direct injects or "inject-pointer" for pointer lookup.
        "address": "FC716C",    // Address of where to inject value.
        "mode": "range",        // Mode of data entry; "range" for a slider type entry, "multiple" for injecting hardcoded values.
        "min": "-2.0",          // Min value allowed.
        "max": "2.0"            // Max value allowed.
        "offset": "60"          // Memory address offset. Used for inject-pointer actions.
        "injects": [            // Array of injects for "multiple" inject mode.
            {
                "address": "000C591C",
                "offset": "28",
                "value": "1.1"
            }
        ]
    }
]
```
### softengine.json
```javascript
[
    {
        "category": "Physics presets",                  // SoftEngine eategory name
        "toggles": [                                    // List of toggles
            {
                "name": "Natural",                      // Name of toggle
                "enable": {                             // Enable toggle
                    "id": "softengine-natural-enable",  // Action id, must contain 'softengine'
                    "action": "inject-pointer",
                    "mode": "multiple",
                    "injects": [
                        {
                            "address": "000C591C",
                            "offsets": "28",
                            "value": "1.5"
                        },
                        // Additional injects...
                    ]
                },
                "disable": {                            // Disable toggle
                    "id": "softengine-natural-disable", // Action id, must contain 'softengine'
                    "action": "inject-pointer",
                    "mode": "multiple",
                    "injects": [
                        {
                            "address": "000C591C",
                            "offsets": ["28", "1B"],
                            "value": "1.1"
                        },
                        // Additional injects...
                    ]
                }
            },
            // Additional toggles...
        ]
    },
    // Additional SoftEngine categories...
]
```



## Dependencies

- [electronjs.org](https://electronjs.org) + [electron-builder](https://www.electron.build/)
- [electron-overlay-window](https://github.com/SnosMe/electron-overlay-window)
- [electron-log](https://github.com/megahertz/electron-log)
- [ejs-electron](https://github.com/bowheart/ejs-electron)
- [node-key-sender](https://github.com/garimpeiro-it/node-key-sender)
- [BootStrap](https://getbootstrap.com/) + [BootStrap Icons](https://icons.getbootstrap.com/)
- [jQuery](https://jquery.com/) + [jQueryUI](https://jqueryui.com/)
- [memoryjs](https://github.com/Rob--/memoryjs)
- [native-is-elevated](https://github.com/arkon/native-is-elevated)
- [list-open-windows](https://github.com/JosephusPaye/list-open-windows)

## Build executable
Building a portable executable file can be done with electron-builder and the following command:


```bash
# Install electron-builder
npm install -g electron-builder
# Run the dist command
npm run dist
```
The executable is generated in the `/dist/` folder.

