import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import readline from 'readline';

// --- 1. Setup: Path and readline interface ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'dist', 'index.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// --- 2. MCP Service Communication Layer ---
let server;
let serverReady = false;
let responseBuffer = '';
const pendingRequests = new Map();

function startMcpServer() {
  server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop();

    for (const line of lines) {
      if (!line) continue;
      try {
        const json = JSON.parse(line);
        if (json.name === 'historical-record' && !serverReady) {
          serverReady = true;
          console.log('[System: MCP Server is ready. You can start chatting.]');
          rl.prompt(); // Show the first prompt
        } else if (json.id && pendingRequests.has(json.id)) {
          const { resolve, reject } = pendingRequests.get(json.id);
          if (json.error) reject(json.error);
          else resolve(json.result);
          pendingRequests.delete(json.id);
        }
      } catch (e) { /* Ignore parsing errors */ }
    }
  });

  server.stderr.on('data', (data) => console.error(`[MCP Server Error: ${data}]`));
  server.on('close', (code) => console.log(`[System: MCP Server exited with code ${code}]`));
}

function callMcpTool(tool, input) {
  if (!serverReady) return Promise.reject('MCP Server not ready.');
  return new Promise((resolve, reject) => {
    const requestId = `req-${Date.now()}-${Math.random()}`;
    const request = { id: requestId, tool, input };
    pendingRequests.set(requestId, { resolve, reject });
    server.stdin.write(JSON.stringify(request) + '\n');
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        reject(new Error(`Request ${requestId} timed out`));
        pendingRequests.delete(requestId);
      }
    }, 3000);
  });
}

// --- 3. Orchestrator and Chat Logic ---
async function handleLineInput(line) {
  const userInput = line.trim();
  if (userInput.toLowerCase() === 'exit') {
    rl.close();
    return;
  }

  // 1. Record user message
  console.log('[System: Recording your message...]');
  await callMcpTool('add_historical_record', { content: { source: 'user', text: userInput } });

  // 2. Simulate AI response
  const aiResponse = `AI: I received your message: "${userInput}". This is a simulated response.`;
  console.log(aiResponse);

  // 3. Record AI response
  console.log('[System: Recording AI response...]');
  await callMcpTool('add_historical_record', { content: { source: 'ai', text: aiResponse } });

  rl.prompt(); // Show next prompt
}

function cleanup() {
  console.log('\n[System: Shutting down...]');
  if (server) server.kill();
  process.exit(0);
}

// --- 4. Main Execution ---
function printWelcomeBanner() {
  console.log('\n\n');
  console.log('========================================');
  console.log('    INTERACTIVE DIALOGUE RECORDER');
  console.log('========================================');
  console.log('\nType your message below and press Enter.');
  console.log('Your message and a simulated AI response');
  console.log('will be automatically recorded.');
  console.log('\nType "exit" to quit.');
  console.log('========================================\n');
}

printWelcomeBanner();
startMcpServer();
rl.setPrompt('You: ');
rl.on('line', handleLineInput);
rl.on('close', cleanup);