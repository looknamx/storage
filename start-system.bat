@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ===================================================
echo   ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
echo   Garage Storage & Fleet Vehicle Management System
echo ===================================================
echo.
echo กำลังเริ่มต้นระบบ...
echo.

:: เปิดเป็น App Window ไร้ช่อง URL ในเบราว์เซอร์ (Chrome / Edge / Default browser)
start "" msedge --app=http://localhost:3000 2>nul || start "" chrome --app=http://localhost:3000 2>nul || start http://localhost:3000

npm run dev
pause
