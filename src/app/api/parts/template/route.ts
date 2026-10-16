import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const sampleData = [
      {
        'รหัสสินค้า': '99-0001-001',
        'ชื่ออะไหล่': 'ไส้กรองน้ำมันเครื่อง HINO',
        'หมวดหมู่': 'ไส้กรอง',
        'หน่วยนับ': 'ลูก',
        'ราคาทุนต่อหน่วย': 350,
        'จำนวนคงเหลือ': 10,
        'สต็อกขั้นต่ำ': 5,
        'ยี่ห้อ': 'HINO',
        'ตำแหน่งจัดเก็บ': 'A-01-01',
      },
      {
        'รหัสสินค้า': '99-0001-002',
        'ชื่ออะไหล่': 'น้ำมันเครื่องดีเซล 15W-40 (ถัง 18L)',
        'หมวดหมู่': 'น้ำมันเครื่องและของเหลว',
        'หน่วยนับ': 'ถัง',
        'ราคาทุนต่อหน่วย': 2400,
        'จำนวนคงเหลือ': 8,
        'สต็อกขั้นต่ำ': 3,
        'ยี่ห้อ': 'Castrol',
        'ตำแหน่งจัดเก็บ': 'B-02-01',
      },
      {
        'รหัสสินค้า': '99-0001-003',
        'ชื่ออะไหล่': 'ผ้าเบรกหน้า ISUZU DECA 360',
        'หมวดหมู่': 'ระบบเบรก',
        'หน่วยนับ': 'ชุด',
        'ราคาทุนต่อหน่วย': 1850,
        'จำนวนคงเหลือ': 4,
        'สต็อกขั้นต่ำ': 2,
        'ยี่ห้อ': 'Bendix',
        'ตำแหน่งจัดเก็บ': 'C-01-02',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    // Adjust column widths
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 35 },
      { wch: 22 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 15 },
      { wch: 18 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'คลังอะไหล่')

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="parts_import_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

