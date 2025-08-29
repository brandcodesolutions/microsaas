const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  description: text('description')
});

const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey(),
  clientName: text('client_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  service: text('service').notNull(),
  professional: text('professional'),
  date: text('date').notNull(),
  time: text('time').notNull(),
  observations: text('observations'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  userId: integer('user_id').references(() => users.id)
});

module.exports = { users, appointments };