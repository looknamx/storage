import { NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function POST() {
  try {
    // Schedule taskkill on Windows to allow response to complete first
    setTimeout(() => {
      exec('taskkill /F /IM node.exe')
    }, 500)

    return NextResponse.json({
      success: true,
      message: 'ปิดระบบเรียบร้อยแล้ว กำลังปิดหน้าต่างการทำงาน...',
    })
  } catch (error: any) {
    console.error('System shutdown error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการปิดระบบ' },
      { status: 500 }
    )
  }
}
