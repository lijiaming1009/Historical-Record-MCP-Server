import subprocess
import json
import uuid
import threading
import time
import sys

class MCPClient:
    """
    A client for communicating with a Model Context Protocol (MCP) server
    over standard input/output.
    """
    def __init__(self, command):
        self.process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        )
        self.responses = {}
        self.server_info = None
        self.stdout_thread = threading.Thread(target=self._read_stdout)
        self.stdout_thread.daemon = True
        self.stdout_thread.start()
        self._wait_for_server_info()

    def _read_stdout(self):
        """Continuously reads from the server's stdout in a separate thread."""
        for line in self.process.stdout:
            try:
                data = json.loads(line)
                if 'id' in data:
                    self.responses[data['id']] = data
                elif 'name' in data:
                    self.server_info = data
            except json.JSONDecodeError:
                # Silently ignore non-JSON lines from stdout
                pass

    def _wait_for_server_info(self):
        """Waits for the server to send its initial information."""
        timeout = 10
        start_time = time.time()
        while self.server_info is None and time.time() - start_time < timeout:
            time.sleep(0.1)
        if self.server_info is None:
            raise TimeoutError("Failed to get server info from the MCP process.")

    def send_request(self, tool_name, params):
        """Sends a tool request to the MCP server."""
        request_id = str(uuid.uuid4())
        request = {"id": request_id, "tool": tool_name, "input": params}
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        return request_id

    def get_response(self, request_id, timeout=10):
        """Retrieves a response corresponding to a request ID."""
        start_time = time.time()
        while request_id not in self.responses and time.time() - start_time < timeout:
            time.sleep(0.1)
        return self.responses.pop(request_id, None)

    def close(self):
        """Terminates the MCP server process."""
        if self.process.poll() is None:
            self.process.terminate()
            self.stdout_thread.join(timeout=2)
