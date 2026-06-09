import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  date,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// users table is managed remotely in neonSchema.ts

// Stores
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id"),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default("kirana"),
  businessType: varchar("business_type", { length: 100 }), // e.g. pharmacy, clothing, hardware
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  fssaiNo: varchar("fssai_no", { length: 20 }),
  drugLicenseNo: varchar("drug_license_no", { length: 50 }),
  address: text("address"),
  state: varchar("state", { length: 50 }),
  stateCode: varchar("state_code", { length: 2 }),
  pincode: varchar("pincode", { length: 6 }),
  phone: varchar("phone", { length: 15 }),
  email: varchar("email", { length: 255 }),
  upiId: varchar("upi_id", { length: 100 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNo: varchar("bank_account_no", { length: 20 }),
  bankIfsc: varchar("bank_ifsc", { length: 11 }),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV"),
  invoiceCounter: integer("invoice_counter").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Categories (Global per store)
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("categories_store_idx").on(t.storeId),
  })
);

// Store Extras (Colors, Sizes, Materials)
export const storeExtras = pgTable(
  "store_extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'color' | 'size' | 'material'
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("store_extras_store_idx").on(t.storeId),
  })
);

// Discounts
export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Eid Special"
    percentage: numeric("percentage", { precision: 5, scale: 2 }).default("0").notNull(),
    rules: jsonb("rules").default('{}').notNull(), // e.g. { categoryIds: [], colorIds: [] }
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("discounts_store_idx").on(t.storeId),
  })
);

// Parties: customers and suppliers
export const parties = pgTable(
  "parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // customer | supplier
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 15 }),
    email: varchar("email", { length: 255 }),
    gstin: varchar("gstin", { length: 15 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    stateCode: varchar("state_code", { length: 2 }),
    creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).default("0"),
    outstandingBalance: numeric("outstanding_balance", { precision: 12, scale: 2 }).default("0").notNull(),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    tag: varchar("tag", { length: 30 }), // regular | vip | defaulter
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("parties_store_idx").on(t.storeId),
  }),
);

// Products
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    categoryId: uuid("category_id").references(() => categories.id), // Link to categories table
    category: varchar("category", { length: 100 }), // Keeping legacy text temporarily for safety
    hsnCode: varchar("hsn_code", { length: 8 }),
    unit: varchar("unit", { length: 20 }).default("PCS").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).default("0").notNull(),
    sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).default("0").notNull(),
    mrp: numeric("mrp", { precision: 10, scale: 2 }).default("0").notNull(), // Deprecated but kept for safety
    gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("18").notNull(),
    minStockLevel: numeric("min_stock_level", { precision: 10, scale: 3 }).default("0").notNull(),
    currentStock: numeric("current_stock", { precision: 10, scale: 3 }).default("0").notNull(), // Base stock
    rackLocation: varchar("rack_location", { length: 100 }), // NEW
    trackExpiry: boolean("track_expiry").default(false).notNull(),
    isScheduleH: boolean("is_schedule_h").default(false).notNull(),
    composition: text("composition"),
    description: text("description"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    hasVariants: boolean("has_variants").default(false).notNull(), // If true, stock is managed via product_variants
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("products_store_idx").on(t.storeId),
    nameIdx: index("products_name_idx").on(t.name),
  }),
);

// Product Units (Multi-unit support)
export const productUnits = pgTable(
  "product_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    unitName: varchar("unit_name", { length: 50 }).notNull(), // e.g. Box, Strip
    conversionRate: numeric("conversion_rate", { precision: 10, scale: 3 }).notNull(), // e.g. 10 (1 strip = 10 tablets)
    price: numeric("price", { precision: 10, scale: 2 }), // Optional specific price for this unit
    barcode: varchar("barcode", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    productIdx: index("product_units_product_idx").on(t.productId),
  })
);

// Product Extras mapping
export const productExtras = pgTable(
  "product_extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    extraId: uuid("extra_id").references(() => storeExtras.id, { onDelete: "cascade" }).notNull(),
  },
  (t) => ({
    productIdx: index("product_extras_product_idx").on(t.productId),
  })
);

// Product Variants (Combos)
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    sizeId: uuid("size_id").references(() => storeExtras.id, { onDelete: "set null" }),
    colorId: uuid("color_id").references(() => storeExtras.id, { onDelete: "set null" }),
    materialId: uuid("material_id").references(() => storeExtras.id, { onDelete: "set null" }),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    currentStock: numeric("current_stock", { precision: 10, scale: 3 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    productIdx: index("product_variants_product_idx").on(t.productId),
  })
);

// Batches (for pharmacy expiry tracking)
export const batches = pgTable("batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id), // If batch belongs to a specific variant
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  batchNo: varchar("batch_no", { length: 100 }).notNull(),
  mfgDate: date("mfg_date"),
  expiryDate: date("expiry_date").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).default("0").notNull(),
  mrp: numeric("mrp", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Inventory Adjustments (Damage, Loss, Initial)
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),
  batchId: uuid("batch_id").references(() => batches.id),
  type: varchar("type", { length: 20 }).notNull(), // 'damage', 'loss', 'correction', 'addition'
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(), // Negative for damage/loss
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    invoiceNo: varchar("invoice_no", { length: 50 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // sale | purchase | estimate | return
    status: varchar("status", { length: 20 }).default("confirmed").notNull(),
    partyId: uuid("party_id").references(() => parties.id),
    partyName: varchar("party_name", { length: 255 }),
    partyPhone: varchar("party_phone", { length: 15 }),
    partyGstin: varchar("party_gstin", { length: 15 }),
    partyAddress: text("party_address"),
    invoiceDate: date("invoice_date").notNull(),
    isIgst: boolean("is_igst").default(false).notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    balanceDue: numeric("balance_due", { precision: 12, scale: 2 }).default("0").notNull(),
    paymentMode: varchar("payment_mode", { length: 50 }).default("cash").notNull(),
    splitPaymentMode1: varchar("split_payment_mode1", { length: 50 }),
    splitAmount1: numeric("split_amount1", { precision: 12, scale: 2 }),
    splitPaymentMode2: varchar("split_payment_mode2", { length: 50 }),
    splitAmount2: numeric("split_amount2", { precision: 12, scale: 2 }),
    appliedDiscountId: uuid("applied_discount_id").references(() => discounts.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    storeIdx: index("invoices_store_idx").on(t.storeId),
    dateIdx: index("invoices_date_idx").on(t.invoiceDate),
  }),
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  variantName: varchar("variant_name", { length: 255 }), // e.g. "Size: XL, Color: Red"
  hsnCode: varchar("hsn_code", { length: 8 }),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }),
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull(),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
});

// Khata entries (credit ledger)
export const khataEntries = pgTable(
  "khata_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").references(() => stores.id).notNull(),
    partyId: uuid("party_id").references(() => parties.id).notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    entryDate: date("entry_date").notNull(),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    paymentMode: varchar("payment_mode", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    partyIdx: index("khata_party_idx").on(t.partyId),
  }),
);

// Expenses
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 50 }).default("cash").notNull(),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// licenses table is managed remotely in neonSchema.ts

// EOD Reports
export const eodReports = pgTable("eod_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  reportDate: date("report_date").notNull(),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  expectedCash: numeric("expected_cash", { precision: 12, scale: 2 }).notNull(),
  actualCash: numeric("actual_cash", { precision: 12, scale: 2 }).notNull(),
  expectedUpi: numeric("expected_upi", { precision: 12, scale: 2 }).notNull(),
  actualUpi: numeric("actual_upi", { precision: 12, scale: 2 }).notNull(),
  discrepancy: numeric("discrepancy", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
