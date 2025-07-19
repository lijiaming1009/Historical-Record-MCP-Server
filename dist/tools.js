import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "./db.js";
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
// --- Tool Implementations ---
export const tools = {
    add_historical_record: {
        description: "Adds a new historical record.",
        input: addRecordInputSchema,
        run: async (input) => {
            const newRecord = {
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
        run: async (input) => {
            let records = [...db.data.records];
            if (input.startDate) {
                records = records.filter(r => new Date(r.timestamp) >= new Date(input.startDate));
            }
            if (input.endDate) {
                records = records.filter(r => new Date(r.timestamp) <= new Date(input.endDate));
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
