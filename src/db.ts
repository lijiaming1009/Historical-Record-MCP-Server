import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// --- Data Model ---
export interface HistoricalRecord {
  id: string;
  timestamp: string;
  content: any;
}

export interface DbSchema {
  records: HistoricalRecord[];
}

// --- Database Singleton ---
const adapter = new JSONFile<DbSchema>('db.json');
const db = new Low(adapter, { records: [] });

// Initialize and export the database instance
await db.read();

export default db;
