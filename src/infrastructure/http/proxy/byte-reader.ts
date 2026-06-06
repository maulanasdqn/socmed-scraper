type Bytes = Uint8Array<ArrayBufferLike>;

const concat = (a: Bytes, b: Bytes): Bytes => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
};

const indexOf = (haystack: Bytes, needle: Bytes): number => {
  for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    let match = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
};

export class ByteReader {
  private buf: Bytes = new Uint8Array(0);

  constructor(private readonly reader: ReadableStreamDefaultReader<Bytes>) {}

  private async fill(): Promise<boolean> {
    const { value, done } = await this.reader.read();
    if (done || !value) return false;
    this.buf = concat(this.buf, value);
    return true;
  }

  async readN(n: number): Promise<Bytes> {
    while (this.buf.length < n) {
      if (!(await this.fill())) break;
    }
    const out = this.buf.slice(0, n);
    this.buf = this.buf.slice(n);
    return out;
  }

  async readUntil(delim: Bytes): Promise<Bytes> {
    for (;;) {
      const idx = indexOf(this.buf, delim);
      if (idx >= 0) {
        const out = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + delim.length);
        return out;
      }
      if (!(await this.fill())) {
        const out = this.buf;
        this.buf = new Uint8Array(0);
        return out;
      }
    }
  }

  async readAll(): Promise<Bytes> {
    const chunks: Bytes[] = this.buf.length ? [this.buf] : [];
    this.buf = new Uint8Array(0);
    for (;;) {
      const { value, done } = await this.reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    let total = 0;
    for (const chunk of chunks) total += chunk.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  release(): void {
    this.reader.releaseLock();
  }
}
