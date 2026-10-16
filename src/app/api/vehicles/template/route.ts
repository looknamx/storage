import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const sampleData = [
      {
        'ทะเบียนรถ': '71-5645',
        'จังหวัด': 'นครราชสีมา',
        'รหัสรถ': 'V-001',
        'ยี่ห้อ': 'HINO',
        'รุ่น': 'VICTOR 500',
        'ประเภทรถ': 'รถบรรทุก 10 ล้อ',
        'ปีรถ': 2565,
        'แผนก/สังกัด': 'บ.นนทนันทน์',
        'ผู้รับผิดชอบ/คนขับ': 'นายสุชานนท์ เจริญสุข',
        'เลขไมล์ปัจจุบัน': 145000,
        'สถานะ': 'พร้อมใช้งาน',
        'เลขตัวถัง (VIN)': '',
        'เลขเครื่องยนต์': '',
        'หมายเหตุ': 'รถพ่วงแม่ลูก',
      },
      {
        'ทะเบียนรถ': '71-6288',
        'จังหวัด': 'นครราชสีมา',
        'รหัสรถ': 'V-002',
        'ยี่ห้อ': 'ISUZU',
        'รุ่น': 'GIGA 380',
        'ประเภทรถ': 'รถหัวลาก',
        'ปีรถ': 2566,
        'แผนก/สังกัด': 'บ.นนทนันทน์',
        'ผู้รับผิดชอบ/คนขับ': 'นายประดิษฐ์ พิมพบุตร',
        'เลขไมล์ปัจจุบัน': 98500,
        'สถานะ': 'พร้อมใช้งาน',
        'เลขตัวถัง (VIN)': '',
        'เลขเครื่องยนต์': '',
        'หมายเหตุ': '',
      },
      {
        'ทะเบียนรถ': '1นจ9801',
        'จังหวัด': 'กรุงเทพมหานคร',
        'รหัสรถ': 'V-003',
        'ยี่ห้อ': 'TOYOTA',
        'รุ่น': 'Hilux Revo',
        'ประเภทรถ': 'กระบะ 4 ประตู',
        'ปีรถ': 2564,
        'แผนก/สังกัด': 'ฝ่ายบริหาร',
        'ผู้รับผิดชอบ/คนขับ': 'นายสมศักดิ์ นำชัย',
        'เลขไมล์ปัจจุบัน': 62000,
        'สถานะ': 'พร้อมใช้งาน',
        'เลขตัวถัง (VIN)': '',
        'เลขเครื่องยนต์': '',
        'หมายเหตุ': 'รถประจำตำแหน่ง',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    // Adjust column widths
    worksheet['!cols'] = [
      { wch: 16 }, // ทะเบียนรถ
      { wch: 18 }, // จังหวัด
      { wch: 14 }, // รหัสรถ
      { wch: 14 }, // ยี่ห้อ
      { wch: 18 }, // รุ่น
      { wch: 20 }, // ประเภทรถ
      { wch: 10 }, // ปีรถ
      { wch: 20 }, // แผนก/สังกัด
      { wch: 24 }, // ผู้รับผิดชอบ/คนขับ
      { wch: 16 }, // เลขไมล์ปัจจุบัน
      { wch: 16 }, // สถานะ
      { wch: 20 }, // VIN
      { wch: 20 }, // Engine
      { wch: 24 }, // หมายเหตุ
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนรถบริษัท')

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="fleet_vehicles_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

