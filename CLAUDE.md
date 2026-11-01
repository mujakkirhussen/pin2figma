# Pin to Figma

If the user asks to set this project up, install it, or get it working, follow `SETUP.md`
step by step. It covers both macOS and Windows; detect the OS first.

Project layout: `extension/` (Chrome, Manifest V3), `figma-plugin/` (Figma dev plugin),
`server/server.py` (stdlib-only Python bridge on 127.0.0.1:3737), `install.sh` /
`install-windows.bat` (start server at login).
