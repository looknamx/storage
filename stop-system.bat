@echo off
title ปิดระบบบริหารรถบริษัท
chcp 65001 > nul

echo กำลังปิดระบบและเซิร์ฟเวอร์พื้นหลัง...
taskkill /F /IM node.exe >nul 2>nul

echo ปิดระบบเรียบร้อยแล้ว
timeout /t 2 >nul
exit
