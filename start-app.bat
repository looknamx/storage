@echo off
title ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
chcp 65001 > nul
cd /d "%~dp0"

echo ===================================================
echo   ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
echo   Garage Storage & Fleet Vehicle Management System
echo ===================================================
echo.
echo กำลังเริ่มต้นระบบ...
echo.

:: 1. ตรวจสอบ dependencies เบื้องต้น
if not exist "node_modules" (
    echo กำลังติดตั้งระบบครั้งแรก กรุณารอสักครู่...
    call npm install
)

:: 2. ตรวจสอบฐานข้อมูล
if not exist "data\storage.db" (
    echo กำลังเตรียมฐานข้อมูล...
    call npx prisma db push
)

:: 3. เปิดหน้าต่าง Loading Screen ทันทีในลักษณะโปรแกรมเดี่ยว (App Mode)
start "" msedge --app="%~dp0loading.html" 2>nul || start "" chrome --app="%~dp0loading.html" 2>nul || start "" "%~dp0loading.html"

:: 4. รันเซิร์ฟเวอร์แบบ dev (เหมือน start-system.bat ที่ทำงานได้ 100%)
npm run dev

pause
