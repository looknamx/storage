@echo off
title ระบบบริหารรถบริษัทและคลังอะไหล่ (Fleet Storage System)
chcp 65001 > nul
cd /d "%~dp0"

echo =====================================================================
echo    ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
echo    Garage Storage & Fleet Vehicle Management System (Production Mode)
echo =====================================================================
echo.

:: 1. ตรวจสอบโฟลเดอร์ node_modules
if not exist "node_modules" (
    echo [1/3] กำลังติดตั้งโปรแกรมและ Dependencies ครั้งแรก...
    call npm install
)

:: 2. ตรวจสอบและสร้างฐานข้อมูลหากยังไม่มี
if not exist "data\storage.db" (
    echo [2/3] กำลังตั้งค่าฐานข้อมูลเริ่มต้น...
    call npx prisma db push
)

:: 3. ตรวจสอบไฟล์ Build (.next)
if not exist ".next" (
    echo [3/3] กำลังคอมไพล์ระบบ (Build Production ครั้งแรก อาจใช้เวลา 30-60 วินาที)...
    call npm run build
)

echo.
echo [OK] ระบบพร้อมใช้งานแล้ว กำลังเปิดหน้าต่างเบราว์เซอร์...
echo ---------------------------------------------------------------------
echo  ที่อยู่ระบบ: http://localhost:3000
echo  (คำแนะนำ: ห้ามปิดหน้าต่างนี้ขณะใช้งาน หากต้องการปิดโปรแกรมให้ปิดหน้าต่างนี้)
echo ---------------------------------------------------------------------
echo.

:: หน่วงเวลา 2 วินาทีเพื่อให้ Server พร้อมก่อนเปิดเบราว์เซอร์
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: รัน Next.js ในโหมด Production (เร็วและเสถียร ไม่โหลดซ้ำ)
call npm run start

pause

