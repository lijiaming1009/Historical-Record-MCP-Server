import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
// --- Database Singleton ---
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { records: [] });
// Initialize and export the database instance
await db.read();
export default db;
