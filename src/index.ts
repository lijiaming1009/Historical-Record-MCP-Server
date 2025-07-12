import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import readline from "readline";

// --- Data Model and Database Setup ---
interface HistoricalRecord {
  id: string;
  timestamp: string;
  content: any;
}

interface DbSchema {
  records: HistoricalRecord[];
}

const adapter = new JSONFile<DbSchema>('db.json');
const db = new Low(adapter, { records: [] });

// --- Tool Schemas and Types ---
const addRecordInputSchema = z.object({
  content: z.any(),
});

const getRecordsInputSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  keyword: z.string().optional(),
  export: z.boolean().optional().default(false),
});

type AddRecordInput = z.infer<typeof addRecordInputSchema>;
type GetRecordsInput = z.infer<typeof getRecordsInputSchema>;

// --- Tool Implementations ---
const tools = {
  add_historical_record: {
    description: "Adds a new historical record.",
    input: addRecordInputSchema,
    run: async (input: AddRecordInput) => {
      const newRecord: HistoricalRecord = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        content: input.content,
      };
      db.data.records.unshift(newRecord);
      await db.write();
      return { success: true, id: newRecord.id };
    },
  },
  get_historical_records: {
    description: "Retrieves historical records with optional filtering and pagination.",
    input: getRecordsInputSchema,
    run: async (input: GetRecordsInput) => {
      let records = [...db.data.records];

      if (input.startDate) {
        records = records.filter(r => new Date(r.timestamp) >= new Date(input.startDate!));
      }
      if (input.endDate) {
        records = records.filter(r => new Date(r.timestamp) <= new Date(input.endDate!));
      }
      if (input.keyword) {
        const keyword = input.keyword.toLowerCase();
        records = records.filter(r => JSON.stringify(r.content).toLowerCase().includes(keyword));
      }

      if (input.export) {
        return records;
      }

      const startIndex = (input.page - 1) * input.limit;
      const endIndex = startIndex + input.limit;
      const paginatedRecords = records.slice(startIndex, endIndex);
      
      return {
        page: input.page,
        limit: input.limit,
        total: records.length,
        data: paginatedRecords,
      };
    },
  },
};

// --- Basic MCP Communication Layer ---
async function main() {
  await db.read();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const serverInfo = {
    name: "historical-record",
    version: "0.1.0",
    tools: Object.fromEntries(
      Object.entries(tools).map(([name, { description, input }]) => [
        name,
        { description, input: input.describe("") },
      ])
    ),
  };

  console.log(JSON.stringify(serverInfo));

  rl.on("line", async (line) => {
    try {
      const request = JSON.parse(line);
      const tool = (tools as any)[request.tool];

      if (tool) {
        const result = await tool.run(request.input);
        console.log(JSON.stringify({ id: request.id, result }));
      } else {
        console.log(JSON.stringify({ id: request.id, error: `Tool not found: ${request.tool}` }));
      }
    } catch (error) {
      console.log(JSON.stringify({ error: "Invalid request" }));
    }
  });
}

main().catch(console.error);
