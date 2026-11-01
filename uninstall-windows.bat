@echo off
rem Stops the Pin to Figma server and removes it from Windows startup.
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Pin2Figma.lnk" >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3737 " ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo Removed. The server will no longer start automatically.
pause
