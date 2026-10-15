@echo off
title ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
chcp 65001 > nul
cd /d "%~dp0"

echo =====================================================================
echo    ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
echo    Garage Storage & Fleet Vehicle Management System
echo =====================================================================
echo.

:: 1. ตรวจสอบโฟลเดอร์ node_modules
if not exist "node_modules" (
    echo [1/3] กำลังติดตั้ง Dependencies เริ่มต้น...
    call npm install
)

:: 2. ตรวจสอบและสร้างฐานข้อมูลหากยังไม่มี
if not exist "data\storage.db" (
    echo [2/3] กำลังเตรียมฐานข้อมูลเริ่มต้น...
    call npx prisma db push
)

:: 3. ตรวจสอบไฟล์ Build
if not exist ".next" (
    echo [3/3] กำลังเตรียมระบบครั้งแรก (กำลัง Build)...
    call npm run build
)

echo.
echo [OK] กำลังเปิดหน้าต่างระบบ...
echo กรุณาอย่าปิดหน้าต่างนี้ขณะใช้งาน
echo.

:: เปิดเบราว์เซอร์หลังจากเซิร์ฟเวอร์รัน
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: รันเซิร์ฟเวอร์
call npm run start

if errorlevel 1 (
    echo.
    echo เกิดข้อผิดพลาดในการรัน Production กำลังสลับไปรัน Development แทน...
    call npm run dev
)

pause
