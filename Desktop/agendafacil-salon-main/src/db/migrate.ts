import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './config';

// Isso irá criar as tabelas automaticamente
migrate(db, { migrationsFolder: './drizzle' });