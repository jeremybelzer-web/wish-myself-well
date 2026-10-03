"""A small WebSocket client with no dependencies, enough for the Curiosities bridge (text frames, ping,
close). Non-blocking after connect, so a host's UI never waits on it: call poll() from a timer or a short loop.
The same file as the Blender add-on's."""
import base64
import json
import os
import socket
import struct
from urllib.parse import urlparse


class Client(object):
    def __init__(self, url="ws://127.0.0.1:7577", timeout=2.0):
        self.url, self.timeout = url, timeout
        self.sock, self.buf, self.closed = None, b"", True

    def connect(self):
        u = urlparse(self.url)
        if u.scheme != "ws":
            raise ValueError("only ws:// addresses")
        self.sock = socket.create_connection((u.hostname or "127.0.0.1", u.port or 80), timeout=self.timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        request = (
            "GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
            "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (u.path or "/", u.hostname, u.port or 80, key)
        )
        self.sock.sendall(request.encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError("the bridge closed the connection")
            head += chunk
        head, self.buf = head.split(b"\r\n\r\n", 1)
        if b" 101 " not in head.split(b"\r\n", 1)[0]:
            raise ConnectionError("the bridge did not accept the connection")
        self.sock.setblocking(False)
        self.closed = False
        return self

    def _frame(self, opcode, payload):
        n = len(payload)
        head = bytes([0x80 | opcode])
        if n < 126:
            head += bytes([0x80 | n])
        elif n < 65536:
            head += bytes([0x80 | 126]) + struct.pack(">H", n)
        else:
            head += bytes([0x80 | 127]) + struct.pack(">Q", n)
        mask = os.urandom(4)
        body = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.setblocking(True)
        try:
            self.sock.sendall(head + mask + body)
        finally:
            self.sock.setblocking(False)

    def send(self, message):
        self._frame(0x1, json.dumps(message).encode("utf-8"))

    def poll(self):
        """Every whole message that has arrived, decoded from JSON. Never blocks."""
        if self.closed:
            return []
        while True:
            try:
                chunk = self.sock.recv(65536)
            except (BlockingIOError, socket.timeout):
                break
            if not chunk:
                self.close()
                break
            self.buf += chunk
        out = []
        while len(self.buf) >= 2:
            b0, b1 = self.buf[0], self.buf[1]
            n, at = b1 & 0x7F, 2
            if n == 126:
                if len(self.buf) < 4:
                    break
                n, at = struct.unpack(">H", self.buf[2:4])[0], 4
            elif n == 127:
                if len(self.buf) < 10:
                    break
                n, at = struct.unpack(">Q", self.buf[2:10])[0], 10
            if b1 & 0x80:
                at += 4  # servers do not mask, but skip a mask if one is there
            if len(self.buf) < at + n:
                break
            payload, self.buf = self.buf[at:at + n], self.buf[at + n:]
            opcode = b0 & 0x0F
            if opcode == 0x1:
                try:
                    out.append(json.loads(payload.decode("utf-8")))
                except ValueError:
                    pass
            elif opcode == 0x9:
                self._frame(0xA, payload)
            elif opcode == 0x8:
                self.close()
                break
        return out

    def close(self):
        if self.sock:
            try:
                self.sock.close()
            except OSError:
                pass
        self.sock, self.closed = None, True
