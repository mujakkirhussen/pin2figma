@echo off
rem Starts the Pin to Figma server now and at every Windows login (no console window).
setlocal
set "DIR=%~dp0"
set "PYEXE="

for /f "delims=" %%i in ('py -3 -c "import sys;print(sys.executable)" 2^>nul') do set "PYEXE=%%i"
if not defined PYEXE for /f "delims=" %%i in ('python -c "import sys;print(sys.executable)" 2^>nul') do set "PYEXE=%%i"
if not defined PYEXE (
  echo Python 3 was not found.
  echo Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH",
  echo then run this file again.
  pause
  exit /b 1
)

rem pythonw.exe runs without a console window
set "PYW=%PYEXE:python.exe=pythonw.exe%"
if not exist "%PYW%" set "PYW=%PYEXE%"

rem stop an older copy if one is running on the port
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3737 " ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1

rem start at every login
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:APPDATA+'\Microsoft\Windows\Start Menu\Programs\Startup\Pin2Figma.lnk'); $s.TargetPath='%PYW%'; $s.Arguments='\"%DIR%server\server.py\"'; $s.WorkingDirectory='%DIR%server'; $s.Save()"

rem start now
start "" "%PYW%" "%DIR%server\server.py"
timeout /t 2 >nul

curl -s http://127.0.0.1:3737/ >nul 2>&1
if errorlevel 1 (
  echo Server did not answer. Try running:  "%PYEXE%" "%DIR%server\server.py"
  pause
  exit /b 1
)
echo Installed. The server is running at http://127.0.0.1:3737 and starts at every login.
echo If Windows asks whether Python may use the network, choose Allow.
pause
