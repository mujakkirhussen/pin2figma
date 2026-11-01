# Setup guide for Claude Code

This file is written for an AI coding assistant (Claude Code). If a user asked you to
"set up Pin to Figma", follow these steps in order. Talk to the user in the language they
used. Keep it short, and tell them what you are doing before each command.

**What this project is:** a Chrome extension adds a "→ Figma" button on Pinterest pins. A
tiny local Python server (`server/server.py`, port 3737) passes the image to a Figma
plugin, which places it on the canvas. Everything runs on the user's own computer.

## 0. Detect the operating system

- macOS: `uname -s` prints `Darwin`.
- Windows: `uname` is missing, or `$env:OS` / `%OS%` is `Windows_NT`.
- Linux is not supported by the install scripts. The server still works: run
  `python3 server/server.py` and skip step 3.

Use the matching commands below. Do not run the macOS steps on Windows or the other way round.

## 1. Put the folder in a permanent place

The auto-start script remembers the folder path. If the folder is in Downloads, a temp
folder, or an unzipped archive, ask the user where to keep it and move it there first
(suggest `~/Pin2Figma` on macOS, `C:\Users\<name>\Pin2Figma` on Windows). If it was
cloned from GitHub, a normal folder in the user's home is fine.

## 2. Check Python 3

- macOS: `python3 --version`. If it fails, macOS will offer to install "Command Line
  Tools". Tell the user to accept the popup, wait for it to finish, then retry.
- Windows: `py -3 --version`, then `python --version`. If both fail, ask the user to
  install Python from https://www.python.org/downloads/ and tick **"Add python.exe to
  PATH"** (or, with their OK, `winget install -e --id Python.Python.3.12`). Then retry in a new terminal.

Python 3.8 or newer is enough. No packages need to be installed.

## 3. Start the server and make it start at login

This changes a login setting on the user's computer, so say so and get a yes first.

- macOS: `bash install.sh` (creates a LaunchAgent). Undo: `bash uninstall.sh`.
- Windows: run `install-windows.bat` (adds a Startup shortcut). Undo: `uninstall-windows.bat`.
  If Windows asks whether Python may use the network, the user should choose **Allow**.

If the user does not want auto-start, skip this and run `python3 server/server.py`
(Windows: `py -3 server\server.py`) in a terminal they keep open.

## 4. Verify the server

```
curl -s http://127.0.0.1:3737/
```

Expected output: `{"ok":true}`. If it fails: macOS, read `server/server.log`; Windows,
run the server in a terminal and read the error. Port 3737 already in use means another
copy is running, which is fine.

## 5. The two steps only the user can do

You cannot click inside Chrome or Figma. Give the user the exact absolute paths, which
you can print with `pwd` (macOS) or `cd` (Windows), and walk them through:

**Chrome extension**
1. Open `chrome://extensions` and switch **Developer mode** on (top right).
2. Click **Load unpacked** and choose the folder `<project>/extension`.

**Figma plugin** (needs the Figma *desktop* app, the browser version cannot do this)
1. Open any Figma design file.
2. Menu: Plugins → Development → **Import plugin from manifest…**
3. Choose `<project>/figma-plugin/manifest.json`.
4. Run it from Plugins → Development → **Pin to Figma** and leave its small window open.
   The window must stay open for pins to arrive. It shows "Connected" when ready.

## 6. Test together

Ask the user to open pinterest.com, hover a pin, and click the blue **→ Figma** button at
its bottom-left. The image should appear on the Figma canvas within about a second.

If the button says "Server off": go back to step 4.
If the button never appears: reload the Pinterest tab (Cmd/Ctrl+R) after loading the extension.
If it says "Sent" but nothing appears: the Figma plugin window is probably closed. Reopen it.

## Rules for you

- Only install what is listed here. Do not edit files outside this folder, and do not change system settings other than the login startup in step 3.
- Never run scripts the user has not agreed to.
- This tool is for personal inspiration boards. Remind the user once that Pinterest images belong to their creators.
