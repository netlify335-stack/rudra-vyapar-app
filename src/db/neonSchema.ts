import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
  boolean,
  integer
} from "drizzle-orm/pg-core";

// Users (Google Login Info)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleId: varchar("google_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Licenses (Subscription Keys)
export const licenses = pgTable("licenses", {
  id: uuid("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(), // BILL-XXXX-XXXX-XXXX
  name: varchar("name", { length: 255 }),
  storeId: varchar("store_id", { length: 255 }),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  isPaused: boolean("is_paused").default(false).notNull(),
  maxDevices: integer("max_devices").default(1),
  validMonths: integer("valid_months"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deviceIds: jsonb("device_ids").default('[]'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit Logs (Admin Actions)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // key_generated, key_revoked, expiry_extended, device_transferred, etc.
  targetEmail: varchar("target_email", { length: 255 }),
  licenseKey: varchar("license_key", { length: 50 }),
  details: jsonb("details").default('{}').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
