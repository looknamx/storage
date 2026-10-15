@echo off
chcp 65001 > nul
echo ===================================================
echo   ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
echo   Garage Storage & Fleet Vehicle Management System
echo ===================================================
echo.
echo กำลังเริ่มต้นระบบ...
cd /d "%~dp0"

echo ตรวจสอบสถานะการทำงาน...
start http://localhost:3000

npm run dev
pause

