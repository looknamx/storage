@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo กำลังสร้างไอคอนทางลัดบน Desktop...
powershell -ExecutionPolicy Bypass -File "%~dp0create-desktop-shortcut.ps1"
echo.
pause

