import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

function normalizeStatus(statusRaw: any): string {
  if (!statusRaw) return 'active'
  const val = String(statusRaw).toLowerCase().trim()
  if (val.includes('รอซ่อม') || val.includes('waiting_repair')) return 'waiting_repair'
  if (val.includes('กำลังซ่อม') || val.includes('อยู่ระหว่างซ่อม') || val.includes('repairing')) return 'repairing'
  if (val.includes('รออะไหล่') || val.includes('waiting_parts')) return 'waiting_parts'
  if (val.includes('หยุด') || val.includes('inactive')) return 'inactive'
  if (val.includes('จำหน่าย') || val.includes('ปลดประจำการ') || val.includes('decommissioned')) return 'decommissioned'
  return 'active'
}

function normalizeYear(yearRaw: any): number | null {
  if (!yearRaw) return null
  const y = parseInt(String(yearRaw).replace(/\D/g, ''))
  if (isNaN(y) || y <= 0) return null
  if (y > 2400) return y - 543 // Convert Buddhist year to CE
  if (y >= 1970 && y <= 2100) return y
  return null
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const updateExisting = formData.get('updateExisting') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Find suitable sheet
    let targetSheetName = workbook.SheetNames[0]
    const sheetPriority = ['ทะเบียนรถ', 'รถบริษัท', 'fleet', 'vehicles', 'รถ', 'ตารางรถ']
    for (const name of sheetPriority) {
      const found = workbook.SheetNames.find((s) => s.toLowerCase().includes(name))
      if (found) {
        targetSheetName = found
        break
      }
    }

    const sheet = workbook.Sheets[targetSheetName]
    if (!sheet) {
      return NextResponse.json({ error: 'ไม่พบชีตข้อมูลในไฟล์ Excel' }, { status: 400 })
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
    if (rawRows.length < 2) {
      return NextResponse.json({ error: 'ไฟล์ Excel ไม่มีข้อมูลรายการ' }, { status: 400 })
    }

    // Header detection
    let headerRowIdx = 0
    let colMap: { [key: string]: number } = {}

    for (let r = 0; r < Math.min(6, rawRows.length); r++) {
      const row = rawRows[r] || []
      const hasPlateCol = row.some((c: any) => /ทะเบียน|license|plate/i.test(String(c)))
      if (hasPlateCol) {
        headerRowIdx = r
        row.forEach((cell: any, idx: number) => {
          const val = String(cell).toLowerCase().trim()
          if (/ทะเบียน|license.*plate|plate/i.test(val) && colMap['plate'] === undefined) colMap['plate'] = idx
          else if (/จังหวัด|province/i.test(val) && colMap['province'] === undefined) colMap['province'] = idx
          else if (/รหัสรถ|code/i.test(val) && colMap['code'] === undefined) colMap['code'] = idx
          else if (/ยี่ห้อ|brand|make/i.test(val) && colMap['brand'] === undefined) colMap['brand'] = idx
          else if (/รุ่น|model/i.test(val) && colMap['model'] === undefined) colMap['model'] = idx
          else if (/ประเภท|type|ชนิด/i.test(val) && colMap['type'] === undefined) colMap['type'] = idx
          else if (/ปี|year/i.test(val) && colMap['year'] === undefined) colMap['year'] = idx
          else if (/แผนก|หน่วยงาน|สังกัด|บริษัท|dept/i.test(val) && colMap['dept'] === undefined) colMap['dept'] = idx
          else if (/ผู้รับผิดชอบ|คนขับ|พนักงานขับ|driver|responsible/i.test(val) && colMap['responsible'] === undefined) colMap['responsible'] = idx
          else if (/ไมล์|mileage|km/i.test(val) && colMap['mileage'] === undefined) colMap['mileage'] = idx
          else if (/สถานะ|status/i.test(val) && colMap['status'] === undefined) colMap['status'] = idx
          else if (/ตัวถัง|chassis|vin/i.test(val) && colMap['vin'] === undefined) colMap['vin'] = idx
          else if (/เครื่องยนต์|เลขเครื่อง|engine/i.test(val) && colMap['engine'] === undefined) colMap['engine'] = idx
          else if (/หมายเหตุ|notes|remark/i.test(val) && colMap['notes'] === undefined) colMap['notes'] = idx
        })
        break
      }
    }

    if (colMap['plate'] === undefined) {
      return NextResponse.json({ error: 'ไม่พบคอลัมน์ "ทะเบียนรถ" หรือ "License Plate" ในหัวตาราง Excel' }, { status: 400 })
    }

    // Existing vehicles mapping
    const existingVehicles = await prisma.vehicle.findMany()
    const plateMap = new Map(existingVehicles.map((v) => [v.licensePlate.trim().toLowerCase(), v]))
    const usedCodes = new Set(existingVehicles.map((v) => v.code))

    // Vehicle types
    const vTypes = await prisma.vehicleType.findMany()
    const defaultTypeName = vTypes[0]?.name || 'รถกระบะ'

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i]
      if (!row || row.length === 0) continue

      const rawPlate = colMap['plate'] !== undefined && row[colMap['plate']] !== undefined ? String(row[colMap['plate']]).trim() : ''
      if (!rawPlate || rawPlate.length < 2) {
        skippedCount++
        continue
      }

      // Clean plate (remove any unnecessary whitespace)
      const licensePlate = rawPlate.replace(/\s+/g, ' ').trim()
      const plateKey = licensePlate.toLowerCase()

      const province = colMap['province'] !== undefined && row[colMap['province']] ? String(row[colMap['province']]).trim() : 'นครราชสีมา'
      const brand = colMap['brand'] !== undefined && row[colMap['brand']] ? String(row[colMap['brand']]).trim() : 'ไม่ระบุ'
      const model = colMap['model'] !== undefined && row[colMap['model']] ? String(row[colMap['model']]).trim() : 'ไม่ระบุ'
      const vehicleType = colMap['type'] !== undefined && row[colMap['type']] ? String(row[colMap['type']]).trim() : defaultTypeName
      const year = colMap['year'] !== undefined ? normalizeYear(row[colMap['year']]) : null
      const department = colMap['dept'] !== undefined && row[colMap['dept']] ? String(row[colMap['dept']]).trim() : null
      const responsiblePerson = colMap['responsible'] !== undefined && row[colMap['responsible']] ? String(row[colMap['responsible']]).trim() : null
      const currentMileage = colMap['mileage'] !== undefined ? parseFloat(String(row[colMap['mileage']]).replace(/,/g, '')) || 0 : 0
      const status = colMap['status'] !== undefined ? normalizeStatus(row[colMap['status']]) : 'active'
      const vin = colMap['vin'] !== undefined && row[colMap['vin']] ? String(row[colMap['vin']]).trim() : null
      const engineNumber = colMap['engine'] !== undefined && row[colMap['engine']] ? String(row[colMap['engine']]).trim() : null
      const notes = colMap['notes'] !== undefined && row[colMap['notes']] ? String(row[colMap['notes']]).trim() : null

      if (plateMap.has(plateKey)) {
        if (updateExisting) {
          const existing = plateMap.get(plateKey)!
          await prisma.vehicle.update({
            where: { id: existing.id },
            data: {
              province: province !== 'ไม่ระบุ' ? province : existing.province,
              brand: brand !== 'ไม่ระบุ' ? brand : existing.brand,
              model: model !== 'ไม่ระบุ' ? model : existing.model,
              vehicleType: vehicleType || existing.vehicleType,
              year: year || existing.year,
              department: department || existing.department,
              responsiblePerson: responsiblePerson || existing.responsiblePerson,
              currentMileage: currentMileage > 0 ? currentMileage : existing.currentMileage,
              status: status || existing.status,
              vin: vin || existing.vin,
              engineNumber: engineNumber || existing.engineNumber,
              notes: notes || existing.notes,
            },
          })
          updatedCount++
        } else {
          skippedCount++
        }
        continue
      }

      // Generate unique vehicle code
      let customCode = colMap['code'] !== undefined && row[colMap['code']] ? String(row[colMap['code']]).trim() : ''
      if (!customCode) {
        customCode = `V-${licensePlate.replace(/\s+/g, '-')}`
      }

      let uniqueCode = customCode
      let suffix = 1
      while (usedCodes.has(uniqueCode)) {
        uniqueCode = `${customCode}-${suffix}`
        suffix++
      }
      usedCodes.add(uniqueCode)

      try {
        const created = await prisma.vehicle.create({
          data: {
            code: uniqueCode,
            licensePlate,
            province,
            brand,
            model,
            vehicleType,
            year,
            department,
            responsiblePerson,
            currentMileage: Math.max(0, currentMileage),
            mileageDate: new Date(),
            status,
            vin,
            engineNumber,
            notes,
          },
        })
        plateMap.set(plateKey, created)
        importedCount++
      } catch (err: any) {
        errors.push(`แถวที่ ${i + 1} (${licensePlate}): ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      sheetName: targetSheetName,
      importedCount,
      updatedCount,
      skippedCount,
      totalProcessed: importedCount + updatedCount + skippedCount,
      errors: errors.slice(0, 10),
    })
  } catch (error: any) {
    console.error('Error importing vehicles Excel:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel' }, { status: 500 })
  }
}

