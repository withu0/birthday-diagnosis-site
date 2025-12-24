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

export const compatibilityData = pgTable("compatibility_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  compatibilityType: integer("compatibility_type").notNull(), // 1-36 as specified
  sheetName: text("sheet_name").notNull(), // e.g., "相性①完成"
  range: text("range").notNull(), // e.g., "A2:AM31"
  aPeach: text("a_peach"), // Aさんのピーチコア value
  aHard: text("a_hard"), // Aさんのハイドコア value
  bPeach: text("b_peach"), // Bさんのピーチコア value
  bHard: text("b_hard"), // Bさんのハイドコア value
  rowIndex: integer("row_index").notNull(), // Row position in the sheet
  colIndex: integer("col_index").notNull(), // Column position in the sheet
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const compatibilityTypes = pgTable("compatibility_types", {
  id: integer("id").primaryKey().notNull(), // 1-36
  name: text("name").notNull(), // e.g., "相性①"
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const skinCompatibility = pgTable("skin_compatibility", {
  id: uuid("id").defaultRandom().primaryKey(),
  skinTypeA: text("skin_type_a").notNull(), // e.g., "天才肌"
  skinTypeB: text("skin_type_b").notNull(), // e.g., "オリジナル肌"
  compatibilityLevel: text("compatibility_level").notNull(), // "良い", "とても良い", "普通", "注意"
  iconType: text("icon_type").notNull(), // "single-circle", "double-circle", "text-only", "triangle"
  relationshipImage: text("relationship_image").notNull(), // Detailed relationship description
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type CompatibilityData = typeof compatibilityData.$inferSelect
export type NewCompatibilityData = typeof compatibilityData.$inferInsert
export type CompatibilityType = typeof compatibilityTypes.$inferSelect
export type NewCompatibilityType = typeof compatibilityTypes.$inferInsert
export type SkinCompatibility = typeof skinCompatibility.$inferSelect
export type NewSkinCompatibility = typeof skinCompatibility.$inferInsert
