/**
 * Utility functions for parsing and calculating Marketing & Transport Logistics data
 */

export interface ParsedTransportJob {
  itemNo?: number;
  jobDate?: Date | null;
  jobMonth?: string;
  jobYear?: number;
  loadingDate?: Date | null;
  loadingTime?: string;
  deliveryDate?: Date | null;
  deliveryTime?: string;
  isApproved: boolean;

  billingDate?: Date | null;
  invoiceNo?: string;
  jobOrderNo?: string;
  isPaid: boolean;
  paymentDate?: Date | null;

  isSubcontractor: boolean;
  vehicleType?: string;
  licensePlate: string;
  driverName: string;

  customerName: string;
  origin: string;
  weightTicketNo?: string;
  destination: string;
  details?: string;

  weightKg: number;
  rateType: string;
  ratePerTon: number;
  grossAmount: number;
  withholdingTax: number;
  netRevenue: number;

  subcontractorRate?: number;
  commission?: number;
  subcontractorDiff?: number;
  subcontractorFuelCost?: number;
  subcontractorWht?: number;
  subcontractorNet?: number;
  subcontractorFuelLiters?: number;
  subcontractorFuelPrice?: number;
  isSubcontractorPaid?: boolean;
  subcontractorPaidDate?: Date | null;

  odometerStart?: number;
  odometerEnd?: number;
  distanceKm?: number;
  fuelLiters?: number;
  fuelEfficiency?: number;
  fuelPricePerLiter?: number;
  fuelCost?: number;

  expenseLoadingUnloading: number;
  expenseFuelSavingBonus: number;
  expenseExtraBonus: number;
  expenseAllowance: number;
  expenseBackhaul: number;
  expenseExpressway: number;
  expensePort: number;
  expenseDetention: number;
  expenseRepair: number;
  expenseOther: number;
  totalExpenses: number;

  netProfit: number;
  notes?: string;
}

/**
 * Parses Thai Buddhist Era or ISO date strings into Date
 * Supported formats:
 * - 2569-07-01 (BE year 2569 -> CE year 2026)
 * - 4/8/2569 (d/m/BE)
 * - 2026-07-01
 */
export function parseThaiOrIsoDate(val: string | null | undefined): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '0') return null;

  // Pattern: 2569-07-01
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('-');
    let year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (year > 2400) year -= 543; // Convert Buddhist Era to CE
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Pattern: 4/8/2569 or 04/08/2569
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year > 2400) year -= 543;
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }

  return null;
}

/**
 * Safely parse float numbers from strings with commas or blanks
 */
export function parseNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  let cleaned = String(val).replace(/[,฿\s]/g, '').trim();
  if (cleaned === '-' || cleaned === '') return defaultVal;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1).trim();
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Parse a single CSV row or array of cells into a typed ParsedTransportJob
 */
export function parseTransportJobRow(cells: string[]): ParsedTransportJob | null {
  if (!cells || cells.length < 20) return null;

  const itemNoStr = cells[0]?.trim();
  const itemNo = parseInt(itemNoStr, 10);

  // If row has no license plate and no customer, skip (it's likely a blank or summary row)
  const licensePlate = cells[13]?.trim() || '';
  const customerName = cells[19]?.trim() || '';

  if (!licensePlate && !customerName) {
    return null;
  }

  const jobMonth = cells[2]?.trim() || 'ก.ค.';
  const loadingDate = parseThaiOrIsoDate(cells[3]);
  const deliveryDate = parseThaiOrIsoDate(cells[5]);
  const billingDate = parseThaiOrIsoDate(cells[8]);
  const invoiceNo = cells[9]?.trim() || '';
  const driverName = cells[14]?.trim() || '';
  const isPaid = cells[15]?.trim().toLowerCase() === 'true' || cells[15]?.trim() === '1';
  const paymentDate = parseThaiOrIsoDate(cells[16]);

  const origin = cells[20]?.trim() || '';
  const weightTicketNo = cells[21]?.trim() || '';
  const destination = cells[22]?.trim() || '';
  const details = cells[23]?.trim() || '';

  const weightKg = parseNumber(cells[24]);
  const rateRaw = cells[25]?.trim();
  const rateType = rateRaw === 'เหมา' ? 'lump_sum' : 'per_ton';
  const ratePerTon = parseNumber(rateRaw);
  const grossAmount = parseNumber(cells[26]);
  const withholdingTax = parseNumber(cells[27]);
  const netRevenue = parseNumber(cells[33]) || (grossAmount - withholdingTax);

  // Odometer and fuel
  const odometerStart = parseNumber(cells[37]);
  const odometerEnd = parseNumber(cells[38]);
  const distanceKm = parseNumber(cells[39]) || (odometerEnd > odometerStart ? odometerEnd - odometerStart : 0);
  const fuelLiters = parseNumber(cells[40]);
  const fuelEfficiency = parseNumber(cells[41]) || (fuelLiters > 0 ? distanceKm / fuelLiters : 0);
  const fuelPricePerLiter = parseNumber(cells[42]);
  const fuelCost = parseNumber(cells[43]) || (fuelLiters * fuelPricePerLiter);

  // Expenses
  const expenseLoadingUnloading = parseNumber(cells[44]);
  const expenseFuelSavingBonus = parseNumber(cells[45]);
  const expenseExtraBonus = parseNumber(cells[46]);
  const expenseAllowance = parseNumber(cells[47]);
  const expenseBackhaul = parseNumber(cells[48]);
  const expenseExpressway = parseNumber(cells[49]);
  const expensePort = parseNumber(cells[50]);
  const expenseDetention = parseNumber(cells[51]);
  const expenseRepair = parseNumber(cells[52]);
  const expenseOther = parseNumber(cells[53]);

  const totalExpenses = parseNumber(cells[54]) || (
    fuelCost +
    expenseLoadingUnloading +
    expenseFuelSavingBonus +
    expenseExtraBonus +
    expenseAllowance +
    expenseBackhaul +
    expenseExpressway +
    expensePort +
    expenseDetention +
    expenseRepair +
    expenseOther
  );

  const netProfit = parseNumber(cells[55]) !== 0
    ? parseNumber(cells[55])
    : (netRevenue - totalExpenses);

  const notes = cells[56]?.trim() || cells[36]?.trim() || '';

  return {
    itemNo: isNaN(itemNo) ? undefined : itemNo,
    jobMonth,
    jobYear: 2569,
    loadingDate,
    deliveryDate,
    isApproved: cells[7]?.trim().toUpperCase() === 'OK',
    billingDate,
    invoiceNo,
    jobOrderNo: cells[10]?.trim() || '',
    isPaid,
    paymentDate,
    isSubcontractor: !!cells[11]?.trim(),
    vehicleType: cells[12]?.trim() || 'รถพ่วง/เทรลเลอร์',
    licensePlate,
    driverName,
    customerName,
    origin,
    weightTicketNo,
    destination,
    details,
    weightKg,
    rateType,
    ratePerTon,
    grossAmount,
    withholdingTax,
    netRevenue,
    odometerStart,
    odometerEnd,
    distanceKm,
    fuelLiters,
    fuelEfficiency,
    fuelPricePerLiter,
    fuelCost,
    expenseLoadingUnloading,
    expenseFuelSavingBonus,
    expenseExtraBonus,
    expenseAllowance,
    expenseBackhaul,
    expenseExpressway,
    expensePort,
    expenseDetention,
    expenseRepair,
    expenseOther,
    totalExpenses,
    netProfit,
    notes,
  };
}

