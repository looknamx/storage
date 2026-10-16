import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

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

    // Find target sheet
    let targetSheetName = workbook.SheetNames[0]
    if (workbook.SheetNames.includes('stock-ตั้งไท้เส็ง+นนทนันทน์')) {
      targetSheetName = 'stock-ตั้งไท้เส็ง+นนทนันทน์'
    } else if (workbook.SheetNames.some((s) => s.toLowerCase().includes('stock') || s.includes('อะไหล่') || s.includes('พัสดุ'))) {
      targetSheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('stock') || s.includes('อะไหล่') || s.includes('พัสดุ'))!
    }

    const sheet = workbook.Sheets[targetSheetName]
    if (!sheet) {
      return NextResponse.json({ error: 'ไม่พบชีตข้อมูลในไฟล์ Excel' }, { status: 400 })
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
    if (rawRows.length < 2) {
      return NextResponse.json({ error: 'ไฟล์ Excel ไม่มีข้อมูลรายการ' }, { status: 400 })
    }

    // Determine header row and column mapping
    let headerRowIdx = 0
    let colMap: { [key: string]: number } = {}

    // Check if this is the legacy format (e.g. stock-ตั้งไท้เส็ง+นนทนันทน์)
    const row0 = rawRows[0] || []
    const isLegacyStockSheet = row0.some((c: any) => String(c).includes('รหัสสินค้า') && String(c).includes('ชื่ออะไหล่')) || targetSheetName.includes('stock-ตั้งไท้เส็ง')

    // Find default categories
    const categories = await prisma.partCategory.findMany()
    const categoryMap = new Map<string, string>()
    categories.forEach((c) => categoryMap.set(c.name.trim().toLowerCase(), c.id))

    // Default category fallback
    let defaultCatId = categoryMap.get('อะไหล่ทั่วไป')
    if (!defaultCatId && categories.length > 0) {
      defaultCatId = categories[0].id
    }

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    if (isLegacyStockSheet) {
      // Legacy format
      // Col 3: รหัสสินค้า, Col 4: ชื่ออะไหล่/สินค้า, Col 5: ราคา, Col 16: ยอดคงเหลือ
      const existingParts = await prisma.part.findMany({ select: { id: true, code: true, name: true } })
      const usedCodes = new Set(existingParts.map((p) => p.code))
      const codeToPartMap = new Map(existingParts.map((p) => [p.code, p]))

      for (let i = 2; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (!row || row.length === 0) continue

        let code = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : ''
        let name = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : ''
        const costPerUnit = typeof row[5] === 'number' ? row[5] : parseFloat(row[5]) || 0
        const quantity = typeof row[16] === 'number' ? row[16] : parseFloat(row[16]) || 0

        if (!code && !name) {
          skippedCount++
          continue
        }

        if (!code && name) code = `GEN-${i + 1}`
        if (!name && code) name = `อะไหล่รหัส ${code}`

        if (codeToPartMap.has(code)) {
          if (updateExisting) {
            const existing = codeToPartMap.get(code)!
            await prisma.part.update({
              where: { id: existing.id },
              data: {
                quantity: Math.max(0, quantity),
                costPerUnit: Math.max(0, costPerUnit),
              },
            })
            updatedCount++
          } else {
            skippedCount++
          }
          continue
        }

        // Handle duplicate code for new items
        let uniqueCode = code
        let suffix = 1
        while (usedCodes.has(uniqueCode)) {
          uniqueCode = `${code}-${suffix}`
          suffix++
        }
        usedCodes.add(uniqueCode)

        try {
          const created = await prisma.part.create({
            data: {
              code: uniqueCode,
              name,
              categoryId: defaultCatId || null,
              unit: 'ชิ้น',
              quantity: Math.max(0, quantity),
              minimumStock: 5,
              costPerUnit: Math.max(0, costPerUnit),
              isActive: true,
            },
          })
          codeToPartMap.set(uniqueCode, created)
          importedCount++
        } catch (e: any) {
          errors.push(`แถวที่ ${i + 1} (${uniqueCode}): ${e.message}`)
        }
      }
    } else {
      // Standard format: detect header row (first row with code and name columns)
      for (let r = 0; r < Math.min(5, rawRows.length); r++) {
        const row = rawRows[r] || []
        const hasCodeCol = row.some((c: any) => /รหัส|code/i.test(String(c)))
        const hasNameCol = row.some((c: any) => /ชื่อ|name|รายการ/i.test(String(c)))
        if (hasCodeCol || hasNameCol) {
          headerRowIdx = r
          row.forEach((cell: any, idx: number) => {
            const val = String(cell).toLowerCase().trim()
            if (/รหัส|code|part.*no/i.test(val) && colMap['code'] === undefined) colMap['code'] = idx
            else if (/ชื่อ|name|description|รายการ/i.test(val) && colMap['name'] === undefined) colMap['name'] = idx
            else if (/หมวด|category/i.test(val) && colMap['category'] === undefined) colMap['category'] = idx
            else if (/หน่วย|unit/i.test(val) && colMap['unit'] === undefined) colMap['unit'] = idx
            else if (/ราคา|ทุน|cost|price/i.test(val) && colMap['cost'] === undefined) colMap['cost'] = idx
            else if (/คงเหลือ|จำนวน|สต็อก|qty|quantity/i.test(val) && colMap['quantity'] === undefined) colMap['quantity'] = idx
            else if (/ขั้นต่ำ|จุดสั่งซื้อ|min/i.test(val) && colMap['min'] === undefined) colMap['min'] = idx
            else if (/ยี่ห้อ|แบรนด์|brand/i.test(val) && colMap['brand'] === undefined) colMap['brand'] = idx
            else if (/ตำแหน่ง|ที่เก็บ|location/i.test(val) && colMap['location'] === undefined) colMap['location'] = idx
          })
          break
        }
      }

      if (colMap['name'] === undefined && colMap['code'] === undefined) {
        return NextResponse.json({ error: 'ไม่พบคอลัมน์ "รหัสสินค้า" หรือ "ชื่ออะไหล่" ในหัวตาราง Excel' }, { status: 400 })
      }

      const existingParts = await prisma.part.findMany({ select: { id: true, code: true, name: true } })
      const usedCodes = new Set(existingParts.map((p) => p.code))
      const codeToPartMap = new Map(existingParts.map((p) => [p.code, p]))

      for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (!row || row.length === 0) continue

        let code = colMap['code'] !== undefined && row[colMap['code']] !== undefined ? String(row[colMap['code']]).trim() : ''
        let name = colMap['name'] !== undefined && row[colMap['name']] !== undefined ? String(row[colMap['name']]).trim() : ''
        const categoryName = colMap['category'] !== undefined && row[colMap['category']] !== undefined ? String(row[colMap['category']]).trim() : ''
        const unit = colMap['unit'] !== undefined && row[colMap['unit']] !== undefined ? String(row[colMap['unit']]).trim() : 'ชิ้น'
        const costPerUnit = colMap['cost'] !== undefined ? parseFloat(row[colMap['cost']]) || 0 : 0
        const quantity = colMap['quantity'] !== undefined ? parseFloat(row[colMap['quantity']]) || 0 : 0
        const minimumStock = colMap['min'] !== undefined ? parseFloat(row[colMap['min']]) || 5 : 5
        const brand = colMap['brand'] !== undefined && row[colMap['brand']] !== undefined ? String(row[colMap['brand']]).trim() : null
        const location = colMap['location'] !== undefined && row[colMap['location']] !== undefined ? String(row[colMap['location']]).trim() : null

        if (!code && !name) {
          skippedCount++
          continue
        }

        if (!code && name) code = `GEN-${i + 1}`
        if (!name && code) name = `อะไหล่รหัส ${code}`

        // Match category
        let categoryId: string | null = null
        if (categoryName) {
          const lowerCat = categoryName.toLowerCase()
          if (categoryMap.has(lowerCat)) {
            categoryId = categoryMap.get(lowerCat)!
          } else {
            // create category
            const newCat = await prisma.partCategory.create({
              data: { name: categoryName, description: `หมวดหมู่ ${categoryName}` },
            })
            categoryMap.set(lowerCat, newCat.id)
            categoryId = newCat.id
          }
        } else {
          categoryId = defaultCatId || null
        }

        if (codeToPartMap.has(code)) {
          if (updateExisting) {
            const existing = codeToPartMap.get(code)!
            await prisma.part.update({
              where: { id: existing.id },
              data: {
                name: name || existing.name,
                categoryId: categoryId || undefined,
                unit: unit || undefined,
                quantity: Math.max(0, quantity),
                minimumStock: Math.max(0, minimumStock),
                costPerUnit: Math.max(0, costPerUnit),
                brand: brand || undefined,
                location: location || undefined,
              },
            })
            updatedCount++
          } else {
            skippedCount++
          }
          continue
        }

        let uniqueCode = code
        let suffix = 1
        while (usedCodes.has(uniqueCode)) {
          uniqueCode = `${code}-${suffix}`
          suffix++
        }
        usedCodes.add(uniqueCode)

        try {
          const created = await prisma.part.create({
            data: {
              code: uniqueCode,
              name,
              categoryId,
              unit: unit || 'ชิ้น',
              quantity: Math.max(0, quantity),
              minimumStock: Math.max(0, minimumStock),
              costPerUnit: Math.max(0, costPerUnit),
              brand,
              location,
              isActive: true,
            },
          })
          codeToPartMap.set(uniqueCode, created)
          importedCount++
        } catch (e: any) {
          errors.push(`แถวที่ ${i + 1} (${uniqueCode}): ${e.message}`)
        }
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
    console.error('Error importing Excel:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel' }, { status: 500 })
  }
}

