@echo off
setlocal
set "NODE_HOME=%~dp0..\.tools\node-v16.20.2-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
cd /d "%~dp0"
if "%1"=="install" (
  "%NODE_HOME%\npm.cmd" install --no-audit
  goto :eof
)
"%NODE_HOME%\node.exe" node_modules\@angular\cli\bin\ng.js serve --port 4413 --proxy-config proxy.conf.json %*
