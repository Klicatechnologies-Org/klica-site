// Uploads an installer to R2 through the Worker's temporary multipart route.
// Usage: UPLOAD_SECRET=... node scripts/upload.mjs <file> <key> [workerBaseUrl]
// Resumable: progress is kept in <file>.upload.json next to the file; re-run the same command to continue.
import { openSync, readSync, statSync, existsSync, readFileSync, writeFileSync, unlinkSync, closeSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

const [file, key, base = 'https://onesitting-downloads.austinemishael.workers.dev'] = process.argv.slice(2);
const secret = process.env.UPLOAD_SECRET;
if (!file || !key || !secret) {
  console.error('usage: UPLOAD_SECRET=... node upload.mjs <file> <key> [base]');
  process.exit(1);
}

const size = statSync(file).size;
const stateFile = process.env.UPLOAD_STATE || join(tmpdir(), `${basename(file)}.upload.json`);
const auth = { Authorization: `Bearer ${secret}` };
const q = (p) => `${base}/_upload/${p}`;
const k = encodeURIComponent(key);

let state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : null;
if (!state || state.key !== key || state.size !== size || !state.partSize) {
  const r = await fetch(q(`create?key=${k}&type=application/x-msi`), { method: 'POST', headers: auth });
  if (!r.ok) throw new Error(`create ${r.status} ${await r.text()}`);
  state = { key, size, partSize: Number(process.env.PART_MB || 10) * 1024 * 1024, uploadId: (await r.json()).uploadId, parts: [] };
  writeFileSync(stateFile, JSON.stringify(state));
}
console.log(`state: ${stateFile}`);
const id = encodeURIComponent(state.uploadId);
const PART = state.partSize; // every part but the last must be the same size
const total = Math.ceil(size / PART);

const fd = openSync(file, 'r');
for (let n = 1; n <= total; n++) {
  if (state.parts.some((p) => p.partNumber === n)) continue;
  const len = Math.min(PART, size - (n - 1) * PART);
  const buf = Buffer.alloc(len);
  readSync(fd, buf, 0, len, (n - 1) * PART);
  // Network drops are retried forever (waits grow to 2 min); only a server refusal (4xx, e.g. a wrong
  // UPLOAD_SECRET) stops the upload, since waiting cannot fix that.
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(q(`part?key=${k}&uploadId=${id}&part=${n}`), { method: 'PUT', headers: auth, body: buf }).catch((e) => ({ ok: false, status: `${e.message} ${e.cause?.code || e.cause?.message || ""}`, text: async () => "" }));
    if (r.ok) { state.parts.push(await r.json()); break; }
    if (typeof r.status === 'number' && r.status >= 400 && r.status < 500) throw new Error(`part ${n}: ${r.status} ${await r.text()}`);
    const wait = Math.min(120, 5 * 2 ** Math.min(attempt - 1, 5));
    console.warn(`part ${n} failed (${r.status}), retry ${attempt} in ${wait}s`);
    await new Promise((res) => setTimeout(res, wait * 1000));
  }
  writeFileSync(stateFile, JSON.stringify(state));
  console.log(`part ${n}/${total} uploaded`);
}
closeSync(fd);

state.parts.sort((a, b) => a.partNumber - b.partNumber);
const r = await fetch(q(`complete?key=${k}&uploadId=${id}`), {
  method: 'POST',
  headers: { ...auth, 'Content-Type': 'application/json' },
  body: JSON.stringify({ parts: state.parts }),
});
if (!r.ok) throw new Error(`complete ${r.status} ${await r.text()}`);
console.log('done', await r.json());
unlinkSync(stateFile);
