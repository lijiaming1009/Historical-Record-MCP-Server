import readline from "readline";
import { tools } from "./tools.js";
/**
 * The main entry point for the MCP server.
 * This function sets up and runs the communication layer to handle tool requests.
 */
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    // 1. Announce server information to the client.
    const serverInfo = {
        name: "historical-record",
        version: "1.0.0", // Updated version
        tools: Object.fromEntries(Object.entries(tools).map(([name, { description, input }]) => [
            name,
            { description, input: input.describe(description) }, // Use description for better context
        ])),
    };
    console.log(JSON.stringify(serverInfo));
    // 2. Listen for incoming requests from the client.
    rl.on("line", async (line) => {
        try {
            const request = JSON.parse(line);
            const tool = tools[request.tool];
            if (!tool) {
                console.log(JSON.stringify({ id: request.id, error: `Tool not found: ${request.tool}` }));
                return;
            }
            // 3. Validate the input for the requested tool.
            const validationResult = tool.input.safeParse(request.input);
            if (!validationResult.success) {
                console.log(JSON.stringify({ id: request.id, error: "Invalid input", details: validationResult.error.format() }));
                return;
            }
            // 4. Run the tool and send back the result.
            const result = await tool.run(validationResult.data);
            console.log(JSON.stringify({ id: request.id, result }));
        }
        catch (error) {
            // Handle cases of malformed JSON requests.
            console.log(JSON.stringify({ error: "Invalid request format." }));
        }
    });
}
main().catch(error => {
    console.error("A fatal error occurred:", error);
    process.exit(1);
});
