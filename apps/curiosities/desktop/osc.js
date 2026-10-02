/* OSC 1.0 over UDP, just what the bridge needs: messages with float, int, string and true/false
   arguments, and bundles (read only). No dependencies. */
function pad4(n) {
  return (n + 3) & ~3;
}
function str(s) {
  const b = Buffer.from(String(s) + "\0", "utf8");
  const out = Buffer.alloc(pad4(b.length));
  b.copy(out);
  return out;
}

function encode(address, args) {
  const tags = [","];
  const parts = [];
  (args || []).forEach((a) => {
    if (a === true || a === false) tags.push(a ? "T" : "F");
    else if (typeof a === "number" && Number.isInteger(a)) {
      tags.push("i");
      const b = Buffer.alloc(4);
      b.writeInt32BE(a);
      parts.push(b);
    } else if (typeof a === "number") {
      tags.push("f");
      const b = Buffer.alloc(4);
      b.writeFloatBE(a);
      parts.push(b);
    } else {
      tags.push("s");
      parts.push(str(a));
    }
  });
  return Buffer.concat([str(address), str(tags.join("")), ...parts]);
}

function readStr(buf, at) {
  const end = buf.indexOf(0, at);
  if (end < 0) throw new Error("bad OSC string");
  return [buf.toString("utf8", at, end), pad4(end + 1)];
}

/* -> [{ address, args }] (a bundle gives each of its messages). */
function decode(buf) {
  if (buf.length >= 8 && buf.toString("ascii", 0, 8) === "#bundle\0") {
    const out = [];
    let at = 16;
    while (at + 4 <= buf.length) {
      const size = buf.readInt32BE(at);
      out.push(...decode(buf.subarray(at + 4, at + 4 + size)));
      at += 4 + size;
    }
    return out;
  }
  let [address, at] = readStr(buf, 0);
  let tags = ",";
  if (at < buf.length) [tags, at] = readStr(buf, at);
  const args = [];
  for (const t of tags.slice(1)) {
    if (t === "f") (args.push(buf.readFloatBE(at)), (at += 4));
    else if (t === "i") (args.push(buf.readInt32BE(at)), (at += 4));
    else if (t === "d") (args.push(buf.readDoubleBE(at)), (at += 8));
    else if (t === "s") {
      const [s, next] = readStr(buf, at);
      args.push(s);
      at = next;
    } else if (t === "T") args.push(true);
    else if (t === "F") args.push(false);
  }
  return [{ address, args }];
}

module.exports = { encode, decode };
