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

:: เปิดหน้าจอ Loading Screen ทันทีในรูปแบบ App Mode (หน้าจอจะเปลี่ยนเป็นหน้าหลักอัตโนมัติเมื่อระบบพร้อม)
start "" msedge --app="%~dp0loading.html" 2>nul || start "" chrome --app="%~dp0loading.html" 2>nul || start "" "%~dp0loading.html"

npm run dev
pause
