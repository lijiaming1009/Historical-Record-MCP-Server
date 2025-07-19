import subprocess
import json
import sys
import time
import tkinter as tk
from tkinter import scrolledtext, messagebox, simpledialog
import argparse
import threading
from mcp_client import MCPClient

# --- Configuration ---
NODE_COMMAND = ["node", "dist/index.js"]

# --- GUI Application Class ---
class App(tk.Tk):
    """The main GUI application window."""
    def __init__(self, client):
        super().__init__()
        self.client = client
        self.title("历史记录查看器")
        self.geometry("700x500")
        self._create_widgets()
        self.view_records()

    def _create_widgets(self):
        """Creates and arranges all the widgets in the window."""
        top_frame = tk.Frame(self)
        top_frame.pack(fill=tk.X, padx=10, pady=5)

        tk.Button(top_frame, text="添加新记录", command=self.add_record).pack(side=tk.LEFT)
        tk.Button(top_frame, text="刷新记录", command=self.view_records).pack(side=tk.LEFT, padx=5)

        self.text_area = scrolledtext.ScrolledText(self, wrap=tk.WORD, state=tk.DISABLED)
        self.text_area.pack(padx=10, pady=10, expand=True, fill=tk.BOTH)
        
        self.status_bar = tk.Label(self, text="欢迎！", bd=1, relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

    def run_in_thread(self, target_func, *args):
        """Runs a function in a separate thread to keep the GUI responsive."""
        thread = threading.Thread(target=target_func, args=args)
        thread.daemon = True
        thread.start()

    def add_record(self):
        content_str = simpledialog.askstring("新记录", "请输入任意评论、笔记或文本:", parent=self)
        if content_str:
            self.run_in_thread(self._add_record_task, content_str)

    def _add_record_task(self, content):
        try:
            self.update_status("正在发送添加记录的请求...")
            req_id = self.client.send_request("add_historical_record", {"content": content})
            response = self.client.get_response(req_id)
            if response and response.get('result', {}).get('success'):
                self.update_status(f"✅ 记录添加成功！ID: {response['result']['id']}")
                self.view_records()
            else:
                self.update_status(f"❌ 添加记录失败。响应: {response}")
        except Exception as e:
            self.show_error(f"发生错误: {e}")

    def view_records(self):
        self.run_in_thread(self._view_records_task)

    def _view_records_task(self):
        self.update_status("正在获取记录...")
        try:
            req_id = self.client.send_request("get_historical_records", {})
            response = self.client.get_response(req_id)
            self.text_area.config(state=tk.NORMAL)
            self.text_area.delete('1.0', tk.END)

            if response and 'result' in response:
                records = response['result'].get('data', [])
                if not records:
                    self.text_area.insert(tk.END, "未找到记录。")
                    self.update_status("未找到记录。")
                else:
                    for record in reversed(records):
                        self.text_area.insert(tk.END, f"--- 记录 ---\n")
                        self.text_area.insert(tk.END, f"ID: {record['id']}\n")
                        self.text_area.insert(tk.END, f"时间戳: {record['timestamp']}\n")
                        content_display = record['content'] if isinstance(record['content'], str) else json.dumps(record['content'], indent=2, ensure_ascii=False)
                        self.text_area.insert(tk.END, f"内容: {content_display}\n\n")
                    self.update_status(f"✅ 成功加载 {len(records)} 条记录。")
            else:
                self.text_area.insert(tk.END, "获取记录失败。")
                self.update_status(f"❌ 获取记录失败。响应: {response}")
        except Exception as e:
            self.show_error(f"获取记录时发生错误: {e}")
        finally:
            self.text_area.config(state=tk.DISABLED)

    def update_status(self, text):
        self.status_bar.config(text=text)

    def show_error(self, message):
        messagebox.showerror("错误", message)
        self.update_status(f"错误: {message}")

# --- Main Execution Logic ---
def main_gui():
    """Initializes the MCP client and launches the GUI."""
    client = None
    try:
        client = MCPClient(NODE_COMMAND)
        app = App(client)
        app.protocol("WM_DELETE_WINDOW", lambda: (client.close(), app.destroy()))
        app.mainloop()
    except Exception as e:
        messagebox.showerror("致命错误", f"发生严重错误:\n{e}")
    finally:
        if client:
            client.close()

def main_cli(args):
    """Handles Command-Line Interface operations."""
    client = None
    try:
        client = MCPClient(NODE_COMMAND)
        if args.add:
            print(f"正在添加记录: \"{args.add}\"...")
            req_id = client.send_request("add_historical_record", {"content": args.add})
            response = client.get_response(req_id)
            if response and response.get('result', {}).get('success'):
                print(f"✅ 记录添加成功！ID: {response['result']['id']}")
            else:
                print(f"❌ 添加记录失败。响应: {response}")
    except Exception as e:
        print(f"发生错误: {e}", file=sys.stderr)
    finally:
        if client:
            client.close()

def main():
    """Parses arguments and decides whether to run in GUI or CLI mode."""
    build_process = subprocess.run(["npm", "run", "build"], shell=True, capture_output=True, text=True)
    if build_process.returncode != 0:
        error_message = f"构建 Node.js 服务器失败:\n{build_process.stderr}"
        print(error_message, file=sys.stderr)
        try:
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("启动错误", error_message)
        except tk.TclError:
            pass
        return

    parser = argparse.ArgumentParser(description="历史记录客户端。默认以GUI模式运行。")
    parser.add_argument("--add", type=str, help="从命令行直接添加一条新记录。")
    args = parser.parse_args()

    if args.add:
        main_cli(args)
    else:
        main_gui()

if __name__ == "__main__":
    main()
