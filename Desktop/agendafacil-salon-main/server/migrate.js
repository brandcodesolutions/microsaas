const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database
const db = new sqlite3.Database('salon.db');

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Migration SQL
const migrationSQL = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "description" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "appointments" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "client_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "service" TEXT NOT NULL,
    "professional" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "observations" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "user_id" INTEGER,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
  )`
];

// Run migrations
db.serialize(() => {
  migrationSQL.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ Migration ${index + 1} failed:`, err);
        process.exit(1);
      } else {
        console.log(`✅ Migration ${index + 1} completed`);
      }
    });
  });
  
  console.log('✅ Database migrated successfully!');
  console.log('📊 Tables created: users, appointments');
});

db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err);
  } else {
    console.log('🔒 Database connection closed');
  }
});