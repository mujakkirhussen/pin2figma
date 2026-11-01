#!/usr/bin/env python3
"""Tiny local bridge: Chrome extension -> POST /pin, Figma plugin -> GET /queue.
Downloads the image server-side so the plugin never hits CORS problems."""
import base64, json, re, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 3737
queue = []
plugin_seen = False


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://www.pinterest.com/",
    "Accept": "image/jpeg,image/png,image/gif,image/*;q=0.8",
}
SIZES = ["originals", "1200x", "736x", "564x"]


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def usable(b):
    # Figma's createImage takes PNG / JPEG / GIF (not WebP)
    return b[:3] == b"\xff\xd8\xff" or b[:8] == b"\x89PNG\r\n\x1a\n" or b[:4] == b"GIF8"


def fetch_best(url):
    """Try the biggest version first, fall back to smaller ones."""
    base = re.sub(r"/(originals|\d+x)/", "/{}/", url, count=1)
    tried = []
    for size in SIZES:
        u = base.format(size)
        try:
            b = fetch(u)
        except Exception as e:
            tried.append(f"{size}: {e}")
            continue
        if usable(b):
            return size, b
        tried.append(f"{size}: unsupported format")
    raise RuntimeError("; ".join(tried))


class H(BaseHTTPRequestHandler):
    def _send(self, code, body=b"{}"):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        if self.path.startswith("/queue"):
            global plugin_seen
            if not plugin_seen:
                print("Figma plugin connected")
            plugin_seen = True
            items = queue[:]
            queue.clear()
            self._send(200, json.dumps(items).encode())
        else:
            self._send(200, b'{"ok":true}')

    def do_POST(self):
        if not self.path.startswith("/pin"):
            return self._send(404)
        data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        url = data.get("url", "")
        if "pinimg.com" not in url:
            return self._send(400, b'{"error":"not a pinimg url"}')
        try:
            size, img = fetch_best(url)
        except Exception as e:
            print(f"failed: {e}")
            return self._send(502, json.dumps({"error": str(e)}).encode())
        queue.append({"data": base64.b64encode(img).decode(), "pin": data.get("pin", ""), "w": data.get("width", 0)})
        print(f"queued pin [{size}] ({len(img)//1024} KB), waiting: {len(queue)}")
        self._send(200)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"pin2figma server on http://127.0.0.1:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
