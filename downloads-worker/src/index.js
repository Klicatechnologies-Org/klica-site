// onesitting-downloads: desktop installers for klicatech.com, served from R2, with per-IP rate
// limiting and a per-day count of COMPLETED downloads in Firestore.

const PLATFORMS = {
  windows: (env) => ({
    key: env.WINDOWS_KEY,
    version: env.WINDOWS_VERSION,
    sha256: env.WINDOWS_SHA256,
    filename: `OneSitting-Setup-${env.WINDOWS_VERSION}.msi`,
    contentType: 'application/x-msi',
  }),
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Disposition, X-App-Version',
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS, ...extra },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Max-Age': '86400' },
      });
    }

    if (path.startsWith('/_upload/')) return handleUpload(request, env, url, path);

    if (path === '/info' && request.method === 'GET') return info(env);

    const platform = path.slice(1);
    if (Object.hasOwn(PLATFORMS, platform) && (request.method === 'GET' || request.method === 'HEAD')) {
      return download(request, env, ctx, platform, PLATFORMS[platform](env));
    }

    if (path === '/') return Response.redirect('https://klicatech.com/', 302);
    return json({ error: 'not_found' }, 404);
  },
};

async function info(env) {
  const out = {};
  for (const [name, describe] of Object.entries(PLATFORMS)) {
    const file = describe(env);
    const head = await env.BUCKET.head(file.key);
    out[name] = head ? { version: file.version, size: head.size, sha256: file.sha256, filename: file.filename } : null;
  }
  out.mac = null; // no macOS build yet
  return json(out, 200, { 'Cache-Control': 'public, max-age=300' });
}

async function download(request, env, ctx, platform, file) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (request.method === 'GET' && env.DOWNLOAD_RL) {
    const { success } = await env.DOWNLOAD_RL.limit({ key: `${platform}:${ip}` });
    if (!success) {
      return json(
        { error: 'rate_limited', message: 'Too many downloads from your network. Please wait a minute and try again.' },
        429,
        { 'Retry-After': '60' },
      );
    }
  }

  const range = request.method === 'GET' ? request.headers.get('Range') : null;
  const object = request.method === 'HEAD'
    ? await env.BUCKET.head(file.key)
    : await env.BUCKET.get(file.key, range ? { range: request.headers } : undefined);
  if (!object) return json({ error: 'unavailable', message: 'This download is not available right now.' }, 503);

  const headers = new Headers(CORS);
  headers.set('Content-Type', file.contentType);
  headers.set('Content-Disposition', `attachment; filename="${file.filename}"`);
  headers.set('Cache-Control', 'no-store');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('X-App-Version', file.version);
  headers.set('ETag', object.httpEtag);

  if (request.method === 'HEAD') {
    headers.set('Content-Length', String(object.size));
    return new Response(null, { headers });
  }

  // A ranged request is a resume or a download manager's chunk: serve it, but it is not one
  // whole download, so it is never counted.
  if (range && object.range) {
    const start = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - start;
    headers.set('Content-Range', `bytes ${start}-${start + length - 1}/${object.size}`);
    headers.set('Content-Length', String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(object.size));

  // Count the download only once every byte has gone out. If the visitor cancels, the pipe
  // errors and nothing is recorded.
  let sent = 0;
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  const { readable, writable } = new TransformStream({
    transform(chunk, controller) { sent += chunk.byteLength; controller.enqueue(chunk); },
    flush() { finish(sent === object.size); },
  });
  object.body.pipeTo(writable).catch(() => finish(false));
  ctx.waitUntil(
    finished
      .then((complete) => (complete ? recordCompleted(env, platform) : null))
      .catch((e) => console.error('count failed', e)),
  );

  return new Response(readable, { headers });
}

// ---- Firestore: website_downloads_daily/{YYYY-MM-DD in Lagos time} -------------------------

function lagosDate(now = Date.now()) {
  return new Date(now + 60 * 60 * 1000).toISOString().slice(0, 10); // WAT = UTC+1, no DST
}

async function recordCompleted(env, platform) {
  if (!env.SA_EMAIL || !env.SA_KEY) {
    console.warn(`completed ${platform} download not recorded: SA_EMAIL/SA_KEY secrets are not set`);
    return;
  }
  const date = lagosDate();
  const name = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${env.STATS_COLLECTION}/${date}`;
  const one = { integerValue: '1' };
  const body = {
    writes: [
      { update: { name, fields: { date: { stringValue: date } } }, updateMask: { fieldPaths: ['date'] } },
      {
        transform: {
          document: name,
          fieldTransforms: [
            { fieldPath: 'total', increment: one },
            { fieldPath: platform, increment: one },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      },
    ],
  };
  const token = await accessToken(env);
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`firestore commit ${res.status}: ${await res.text()}`);
}

let cachedToken = null; // { value, expires }

async function accessToken(env) {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: env.SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const pem = env.SA_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${b64url(new Uint8Array(sig))}`,
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---- Temporary multipart upload (exists only while the UPLOAD_SECRET secret is set) --------

async function handleUpload(request, env, url, path) {
  if (!env.UPLOAD_SECRET) return json({ error: 'not_found' }, 404);
  const auth = request.headers.get('Authorization') || '';
  if (!timingSafeEqual(auth, `Bearer ${env.UPLOAD_SECRET}`)) return json({ error: 'unauthorized' }, 401);

  const key = url.searchParams.get('key');
  if (!key || !/^(windows|mac)\/[\w.\-]+$/.test(key)) return json({ error: 'bad_key' }, 400);

  if (path === '/_upload/create' && request.method === 'POST') {
    const upload = await env.BUCKET.createMultipartUpload(key, {
      httpMetadata: { contentType: url.searchParams.get('type') || 'application/octet-stream' },
    });
    return json({ uploadId: upload.uploadId });
  }
  const uploadId = url.searchParams.get('uploadId');
  if (!uploadId) return json({ error: 'no_upload_id' }, 400);
  const upload = env.BUCKET.resumeMultipartUpload(key, uploadId);

  if (path === '/_upload/part' && request.method === 'PUT') {
    const part = await upload.uploadPart(Number(url.searchParams.get('part')), request.body);
    return json(part);
  }
  if (path === '/_upload/complete' && request.method === 'POST') {
    const { parts } = await request.json();
    const object = await upload.complete(parts);
    return json({ key: object.key, size: object.size, etag: object.etag });
  }
  if (path === '/_upload/abort' && request.method === 'POST') {
    await upload.abort();
    return json({ aborted: true });
  }
  return json({ error: 'not_found' }, 404);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
