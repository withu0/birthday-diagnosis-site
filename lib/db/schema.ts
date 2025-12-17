import { pgTable, text, timestamp, uuid, integer, boolean, decimal, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  isAdmin: boolean("is_admin").notNull().default(false), // Admin flag for quick access check
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  planType: text("plan_type").notNull(), // "basic", "standard", "premium"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "bank_transfer", "credit_card", "direct_debit"
  univapayOrderId: text("univapay_order_id"),
  univapayTransactionId: text("univapay_transaction_id"),
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed", "cancelled"
  companyName: text("company_name"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  postalCode: text("postal_code").notNull(),
  address: text("address").notNull(),
  gender: text("gender").notNull(),
  birthDate: timestamp("birth_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  paymentId: uuid("payment_id").references(() => payments.id).notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  accessGrantedAt: timestamp("access_granted_at").defaultNow().notNull(),
  accessExpiresAt: timestamp("access_expires_at").notNull(), // 6ヶ月後
  isActive: boolean("is_active").notNull().default(true),
  credentialsSentAt: timestamp("credentials_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const diagnosisResults = pgTable("diagnosis_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(), // Store as string to match input format
  resultData: jsonb("result_data").notNull(), // Store all diagnosis result data as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  membership: one(memberships, {
    fields: [users.id],
    references: [memberships.userId],
  }),
  payments: many(payments),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  membership: one(memberships, {
    fields: [payments.id],
    references: [memberships.paymentId],
  }),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [memberships.paymentId],
    references: [payments.id],
  }),
}))

export const diagnosisResultsRelations = relations(diagnosisResults, ({ one }) => ({
  // No relations for now, but can add user relation later if needed
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert
export type DiagnosisResult = typeof diagnosisResults.$inferSelect
export type NewDiagnosisResult = typeof diagnosisResults.$inferInsert
