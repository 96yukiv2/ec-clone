import { pgTable, serial, integer, text, boolean, numeric, timestamp, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: serial('id').primaryKey(), email: text('email').notNull().unique(),
  name: text('name').notNull(), passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('customer'), createdAt: timestamp('created_at').defaultNow().notNull()
});
export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, {onDelete:'cascade'}),
  expiresAt: timestamp('expires_at').notNull()
});
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(), name: text('name').notNull().unique(), slug: text('slug').notNull().unique()
});
export const products = pgTable('products', {
  id: serial('id').primaryKey(), name: text('name').notNull(), slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''), price: integer('price').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  stock: integer('stock').notNull().default(0), image: text('image').notNull().default(''),
  active: boolean('active').notNull().default(true), createdAt: timestamp('created_at').defaultNow().notNull()
});
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, {onDelete:'cascade'}),
  postalCode: text('postal_code').notNull(), region: text('region').notNull(),
  city: text('city').notNull(), line1: text('line1').notNull(), line2: text('line2').notNull().default('')
});
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, {onDelete:'cascade'}),
  productId: integer('product_id').notNull().references(() => products.id), quantity: integer('quantity').notNull()
}, t => [uniqueIndex('cart_user_product').on(t.userId,t.productId)]);
export const coupons = pgTable('coupons', {
  code: text('code').primaryKey(), discountPercent: integer('discount_percent').notNull(), active: boolean('active').default(true).notNull()
});
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending_payment'),
  subtotal: integer('subtotal').notNull(), discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull().default(0), total: integer('total').notNull(),
  couponCode: text('coupon_code'), shippingAddress: jsonb('shipping_address'),
  idempotencyKey: text('idempotency_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, t => [uniqueIndex('order_user_idempotency').on(t.userId,t.idempotencyKey)]);
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(), orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(), unitPrice: integer('unit_price').notNull(), quantity: integer('quantity').notNull()
});
export const favorites = pgTable('favorites', {
  userId: integer('user_id').notNull().references(() => users.id, {onDelete:'cascade'}),
  productId: integer('product_id').notNull().references(() => products.id, {onDelete:'cascade'})
}, t => [uniqueIndex('favorite_unique').on(t.userId,t.productId)]);
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id),
  productId: integer('product_id').notNull().references(() => products.id),
  rating: integer('rating').notNull(), body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, t => [uniqueIndex('review_unique').on(t.userId,t.productId)]);
export const reviewVotes = pgTable('review_votes', {
  userId: integer('user_id').notNull().references(() => users.id), reviewId: integer('review_id').notNull().references(() => reviews.id),
}, t => [uniqueIndex('review_vote_unique').on(t.userId,t.reviewId)]);
export const history = pgTable('view_history', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id),
  productId: integer('product_id').notNull().references(() => products.id),
  viewedAt: timestamp('viewed_at').defaultNow().notNull()
});
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(), actorId: integer('actor_id').references(() => users.id),
  action: text('action').notNull(), details: jsonb('details'), createdAt: timestamp('created_at').defaultNow().notNull()
});
