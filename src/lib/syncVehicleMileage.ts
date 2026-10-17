import { prisma } from '@/lib/prisma';

/**
 * Normalizes and extracts the primary license plate number from a string
 * e.g. "นม.71-0295 , 71-0296" -> "71-0295"
 */
export function extractPrimaryPlate(plate: string): string {
  if (!plate) return '';
  const match = plate.match(/\d{1,2}-\d{3,4}/);
  return match ? match[0] : plate.trim();
}

/**
 * Finds or links a company vehicle from Program A (Vehicle table)
 */
export async function findOrCreateCompanyVehicle({
  licensePlate,
  vehicleId,
  driverName,
  vehicleType,
  odometer,
  date,
}: {
  licensePlate: string;
  vehicleId?: string | null;
  driverName?: string | null;
  vehicleType?: string | null;
  odometer?: number;
  date?: Date | null;
}) {
  const cleanPlate = (licensePlate || '').trim();
  if (!cleanPlate || cleanPlate === 'ไม่ระบุ') return null;

  // 1. Try finding by vehicleId if provided
  if (vehicleId) {
    const existingById = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (existingById) return existingById;
  }

  // 2. Try exact match on licensePlate
  let vehicle = await prisma.vehicle.findFirst({
    where: {
      licensePlate: {
        equals: cleanPlate,
        mode: 'insensitive',
      },
    },
  });

  // 3. Try matching by primary plate digits (e.g. "71-0295")
  if (!vehicle) {
    const primary = extractPrimaryPlate(cleanPlate);
    if (primary) {
      vehicle = await prisma.vehicle.findFirst({
        where: {
          licensePlate: {
            contains: primary,
            mode: 'insensitive',
          },
        },
      });
    }
  }

  // 4. If not found, auto-register this company vehicle into Program A
  if (!vehicle) {
    const totalVehicles = await prisma.vehicle.count();
    const code = `FLT-${String(totalVehicles + 1).padStart(3, '0')}`;
    const province = cleanPlate.startsWith('นม.') ? 'นครราชสีมา' : 'กรุงเทพมหานคร';

    vehicle = await prisma.vehicle.create({
      data: {
        code,
        licensePlate: cleanPlate,
        province,
        brand: 'Hino / Isuzu',
        model: 'หัวลาก / เทรลเลอร์',
        vehicleType: vehicleType || 'รถพ่วง/เทรลเลอร์',
        department: 'ฝ่ายเดินรถขนส่ง',
        responsiblePerson: driverName || null,
        startDate: date || new Date(),
        currentMileage: odometer || 0,
        mileageDate: date || new Date(),
        status: 'active',
        notes: 'ลงทะเบียนอัตโนมัติจากระบบแผนงานขนส่ง (ฝ่ายการตลาด)',
      },
    });

    if (odometer && odometer > 0) {
      await prisma.odometerReading.create({
        data: {
          vehicleId: vehicle.id,
          reading: odometer,
          readingDate: date || new Date(),
          source: 'transport_job',
          notes: 'บันทึกเลขไมล์ตั้งต้นจากการลงทะเบียนเที่ยววิ่ง',
        },
      });
    }
  }

  return vehicle;
}

/**
 * Synchronizes the odometer reading of a completed or new transport job
 * to Program A's Vehicle table.
 *
 * Rule: Only updates if new odometer > vehicle.currentMileage.
 */
export async function syncJobVehicleMileage({
  jobId,
  jobNo,
  licensePlate,
  vehicleId,
  driverName,
  vehicleType,
  odometerEnd,
  date,
  origin,
  destination,
  isSubcontractor,
}: {
  jobId?: string;
  jobNo?: number | string | null;
  licensePlate: string;
  vehicleId?: string | null;
  driverName?: string | null;
  vehicleType?: string | null;
  odometerEnd: number;
  date?: Date | null;
  origin?: string | null;
  destination?: string | null;
  isSubcontractor?: boolean;
}) {
  // Never sync mileage for subcontractor trucks (not company-owned)
  if (isSubcontractor) return null;

  const vehicle = await findOrCreateCompanyVehicle({
    licensePlate,
    vehicleId,
    driverName,
    vehicleType,
    odometer: odometerEnd,
    date,
  });

  if (!vehicle) return null;

  // Only update currentMileage if the new odometer is greater than existing
  if (odometerEnd > 0 && odometerEnd > vehicle.currentMileage) {
    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        currentMileage: odometerEnd,
        mileageDate: date || new Date(),
        responsiblePerson: driverName || vehicle.responsiblePerson,
      },
    });

    // Record in odometerReadings history
    await prisma.odometerReading.create({
      data: {
        vehicleId: vehicle.id,
        reading: odometerEnd,
        readingDate: date || new Date(),
        source: 'transport_job',
        referenceId: jobId || null,
        notes: `อัปเดตจากเที่ยววิ่ง #${jobNo || ''} (${origin || 'ต้นทาง'} ➔ ${destination || 'ปลายทาง'})`,
      },
    });

    return updated;
  }

  return vehicle;
}

/**
 * Batch sync: Scans all company transport jobs and syncs
 * the maximum mileage for each company vehicle into Program A.
 */
export async function syncAllFleetVehiclesFromJobs() {
  const jobs = await prisma.transportJob.findMany({
    where: { isSubcontractor: false },
    orderBy: { itemNo: 'asc' },
  });

  const truckMap = new Map<string, {
    plate: string;
    driverName: string;
    vehicleType: string;
    maxOdometer: number;
    lastDate: Date | null;
  }>();

  for (const j of jobs) {
    const rawPlate = (j.licensePlate || '').trim();
    if (!rawPlate || rawPlate === 'ไม่ระบุ') continue;

    if (!truckMap.has(rawPlate)) {
      truckMap.set(rawPlate, {
        plate: rawPlate,
        driverName: j.driverName || 'ไม่ระบุ',
        vehicleType: j.vehicleType || 'รถพ่วง/เทรลเลอร์',
        maxOdometer: j.odometerEnd || 0,
        lastDate: j.deliveryDate || j.loadingDate || null,
      });
    } else {
      const item = truckMap.get(rawPlate)!;
      if ((j.odometerEnd || 0) > item.maxOdometer) {
        item.maxOdometer = j.odometerEnd || 0;
        item.lastDate = j.deliveryDate || j.loadingDate || item.lastDate;
      }
    }
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const [plate, info] of truckMap.entries()) {
    const vehicle = await findOrCreateCompanyVehicle({
      licensePlate: info.plate,
      driverName: info.driverName,
      vehicleType: info.vehicleType,
      odometer: info.maxOdometer,
      date: info.lastDate,
    });

    if (vehicle) {
      if (info.maxOdometer > vehicle.currentMileage) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            currentMileage: info.maxOdometer,
            mileageDate: info.lastDate || new Date(),
          },
        });
        updatedCount++;
      } else {
        createdCount++;
      }

      // Link vehicleId back to TransportJob records matching this plate
      await prisma.transportJob.updateMany({
        where: {
          licensePlate: info.plate,
          vehicleId: null,
        },
        data: {
          vehicleId: vehicle.id,
        },
      });
    }
  }

  return {
    totalTrucks: truckMap.size,
    createdCount,
    updatedCount,
  };
}

