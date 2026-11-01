#!/bin/bash
# Stops the pin2figma server and removes it from login startup.
LABEL="com.pin2figma.server"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
echo "Removed. The server will no longer start automatically."
