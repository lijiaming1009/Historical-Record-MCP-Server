import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the compiled server entry point
const serverPath = path.join(__dirname, 'dist', 'index.js');

// Start the server as a child process
const server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

let serverReady = false;
let responseBuffer = '';
const pendingRequests = new Map();

// Function to send a request to the server and return a promise
function callTool(tool, input) {
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

// The main test sequence
async function runTestFlow() {
  try {
    const userMessage = "如果我进行对话，会自动记录嘛，就比说说我现在说的这句";
    console.log(`\nCalling "add_historical_record" to add the user's message: "${userMessage}"`);
    const addResult = await callTool('add_historical_record', {
      content: {
        source: "user",
        text: userMessage
      }
    });
    console.log('\nReceived "add" result:');
    console.log(JSON.stringify(addResult, null, 2));

    console.log('\nCalling "get_historical_records" to verify...');
    const getResult = await callTool('get_historical_records', {});
    console.log('\nReceived "get" result:');
    console.log(JSON.stringify(getResult, null, 2));

  } catch (error) {
    console.error('Test flow failed:', error);
  } finally {
    server.kill();
    process.exit(0);
  }
}

// Listen for server output
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop(); // Keep the last, possibly incomplete line

  for (const line of lines) {
    if (!line) continue;
    try {
      const json = JSON.parse(line);

      if (json.name === 'historical-record' && json.tools && !serverReady) {
        serverReady = true;
        console.log('MCP Server is ready.');
        console.log('Server Info:', JSON.stringify(json, null, 2));
        runTestFlow();
      } else if (json.id && pendingRequests.has(json.id)) {
        const { resolve, reject } = pendingRequests.get(json.id);
        if (json.error) {
          reject(json.error);
        } else {
          resolve(json.result);
        }
        pendingRequests.delete(json.id);
      }
    } catch (e) {
      console.error('Could not parse JSON from server:', line);
    }
  }
});

// Listen for server errors
server.stderr.on('data', (data) => {
  console.error(`Server stderr: ${data}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
});

// Timeout if the server doesn't respond
setTimeout(() => {
  if (!server.killed) {
    console.error('Error: Test client timed out.');
    server.kill();
    process.exit(1);
  }
}, 8000);