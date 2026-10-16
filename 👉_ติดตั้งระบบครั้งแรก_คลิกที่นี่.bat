@echo off
title ติดตั้งระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง
chcp 65001 > nul
cd /d "%~dp0"

echo =====================================================================
echo    ยินดีต้อนรับสู่โปรแกรมติดตั้งระบบบริหารรถและคลังอะไหล่
echo    (ระบบจะดำเนินการตั้งค่าอัตโนมัติ กรุณารอสักครู่...)
echo =====================================================================
echo.

:: 1. ตรวจสอบว่าเครื่องมี Node.js หรือยัง
echo [1/4] กำลังตรวจสอบโปรแกรมพื้นฐาน (Node.js)...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ไม่พบ Node.js ในเครื่อง กำลังพยายามติดตั้งให้อัตโนมัติ...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo.
        echo [คำเตือน] กรุณาติดตั้ง Node.js ก่อนเริ่มใช้งาน
        echo ระบบกำลังเปิดหน้าต่างดาวน์โหลด Node.js ให้ท่าน...
        start https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
        echo กรุณากดติดตั้งไฟล์ที่ดาวน์โหลดมา แล้วกลับมาดับเบิลคลิกไฟล์นี้ใหม่อีกครั้งครับ
        pause
        exit /b
    )
    echo ติดตั้ง Node.js เรียบร้อยแล้ว!
) else (
    echo [OK] ตรวจพบ Node.js พร้อมใช้งาน
)

:: 2. ติดตั้ง Dependencies และแพ็กเกจ
echo.
echo [2/4] กำลังเตรียมความพร้อมของระบบ (อาจใช้เวลาประมาณ 1-2 นาที)...
call npm install --loglevel=error

:: 3. เตรียมฐานข้อมูลและคอมไพล์ระบบ
echo.
echo [3/4] กำลังจัดเตรียมฐานข้อมูลในเครื่องและปรับปรุงระบบ...
call npx prisma db push --skip-generate
call npm run build

:: 4. สร้างไอคอนทางลัดบนหน้าจอ Desktop ให้อัตโนมัติ
echo.
echo [4/4] กำลังสร้างไอคอนบนหน้าจอ Desktop...
powershell -ExecutionPolicy Bypass -File "%~dp0create-desktop-shortcut.ps1"

echo.
echo =====================================================================
echo   [สำเร็จ!] ติดตั้งระบบเรียบร้อยแล้ว
echo   มีไอคอน "FleetManagement" ปรากฏอยู่บนหน้าจอ Desktop ของท่านแล้ว
echo   ระบบกำลังเปิดโปรแกรมให้ท่านใช้งานใน 3 วินาที...
echo =====================================================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:3000
call npm run start

pause
