// GST helpers — Indian tax calculation

export interface LineInput {
  rate: number; // selling rate per unit (pre-tax) OR MRP-inclusive — we treat as pre-tax
  quantity: number;
  discountPercent?: number;
  gstRate: number; // %
}

export interface LineResult {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function calcLine(line: LineInput): LineResult {
  const gross = line.rate * line.quantity;
  const discount = (gross * (line.discountPercent ?? 0)) / 100;
  const taxable = gross - discount;
  const tax = (taxable * line.gstRate) / 100;
  const total = taxable + tax;
  return {
    taxableAmount: round2(taxable),
    taxAmount: round2(tax),
    totalAmount: round2(total),
  };
}

export interface InvoiceTotalsInput {
  items: LineInput[];
  isIgst: boolean;
}

export function calcInvoiceTotals(input: InvoiceTotalsInput) {
  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  for (const item of input.items) {
    const gross = item.rate * item.quantity;
    const d = (gross * (item.discountPercent ?? 0)) / 100;
    const tx = gross - d;
    const tax = (tx * item.gstRate) / 100;
    subtotal += gross;
    discount += d;
    taxable += tx;
    if (input.isIgst) igst += tax;
    else {
      cgst += tax / 2;
      sgst += tax / 2;
    }
  }
  const total = taxable + cgst + sgst + igst;
  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discount),
    taxableAmount: round2(taxable),
    cgstAmount: round2(cgst),
    sgstAmount: round2(sgst),
    igstAmount: round2(igst),
    totalAmount: round2(total),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

export const GST_RATES = [0, 5, 12, 18, 28];
