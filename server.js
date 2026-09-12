// PKSahu.com backend — plain Node.js, zero external dependencies.
// Run with:  node server.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

// ---------- Config (.env, parsed by hand — no dotenv package needed) ----------
function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}
// Merge .env file with real process env vars — hosting platforms (Render,
// Railway, etc.) inject config via process.env, not a .env file, so those
// take priority when present.
const env = Object.assign(loadEnv(path.join(__dirname, '.env')), process.env);
const PORT = Number(env.PORT) || 3000;
const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_HASH || ''; // "salt:hash"

// ---------- Paths ----------
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const VLOGS_FILE = path.join(DATA_DIR, 'vlogs.json');
const RESUME_META_FILE = path.join(DATA_DIR, 'resume.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- Sessions (in-memory; resets on restart) ----------
// Fine for a single-admin personal site. For multi-instance / production use,
// swap this for a real session store or a signed JWT.
const sessions = new Map(); // token -> expiry timestamp
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}
function isSessionValid(token) {
  if (!token || !sessions.has(token)) return false;
  const expiry = sessions.get(token);
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}
function destroySession(token) {
  sessions.delete(token);
}

function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(attempt, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// ---------- Small helpers ----------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    const LIMIT = 15 * 1024 * 1024; // 15MB, enough for a resume PDF as base64
    req.on('data', chunk => {
      size += chunk.length;
      if (size > LIMIT) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

function serveStaticFile(res, absPath) {
  fs.readFile(absPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(absPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- Request handler ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    // ---- Auth ----
    if (pathname === '/api/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { username, password } = body;
      if (username === ADMIN_USERNAME && verifyPassword(password || '', ADMIN_PASSWORD_HASH)) {
        const token = createSession();
        res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Strict`);
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 401, { ok: false, error: 'Invalid username or password' });
    }

    if (pathname === '/api/logout' && req.method === 'POST') {
      destroySession(getCookie(req, 'session'));
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/session' && req.method === 'GET') {
      return sendJson(res, 200, { loggedIn: isSessionValid(getCookie(req, 'session')) });
    }

    // Everything under /api/ except login/logout/session (above) requires auth for writes.
    const requireAdmin = () => isSessionValid(getCookie(req, 'session'));

    // ---- Vlogs ----
    if (pathname === '/api/vlogs' && req.method === 'GET') {
      const data = fs.existsSync(VLOGS_FILE) ? fs.readFileSync(VLOGS_FILE, 'utf8') : '[]';
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(data);
    }

    if (pathname === '/api/vlogs' && req.method === 'PUT') {
      if (!requireAdmin()) return sendJson(res, 401, { ok: false, error: 'Not logged in' });
      const body = await readJsonBody(req);
      if (!Array.isArray(body)) return sendJson(res, 400, { ok: false, error: 'Expected an array of episodes' });
      fs.writeFileSync(VLOGS_FILE, JSON.stringify(body, null, 2));
      return sendJson(res, 200, { ok: true });
    }

    // ---- Resume ----
    if (pathname === '/api/resume' && req.method === 'GET') {
      const meta = fs.existsSync(RESUME_META_FILE) ? JSON.parse(fs.readFileSync(RESUME_META_FILE, 'utf8')) : {};
      return sendJson(res, 200, meta);
    }

    if (pathname === '/api/resume' && req.method === 'POST') {
      if (!requireAdmin()) return sendJson(res, 401, { ok: false, error: 'Not logged in' });
      const body = await readJsonBody(req);
      const { filename, mime, dataBase64 } = body;
      if (!filename || !dataBase64) return sendJson(res, 400, { ok: false, error: 'Missing file data' });
      const ext = path.extname(filename) || '.pdf';
      const storedName = 'resume' + ext;
      fs.writeFileSync(path.join(UPLOADS_DIR, storedName), Buffer.from(dataBase64, 'base64'));
      const meta = { filename, mime: mime || 'application/octet-stream', storedName, uploadedAt: new Date().toISOString() };
      fs.writeFileSync(RESUME_META_FILE, JSON.stringify(meta, null, 2));
      return sendJson(res, 200, { ok: true, meta });
    }

    if (pathname === '/resume' && req.method === 'GET') {
      const meta = fs.existsSync(RESUME_META_FILE) ? JSON.parse(fs.readFileSync(RESUME_META_FILE, 'utf8')) : {};
      if (!meta.storedName) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('No resume uploaded yet');
      }
      const filePath = path.join(UPLOADS_DIR, meta.storedName);
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Resume file missing');
        }
        res.writeHead(200, {
          'Content-Type': meta.mime || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${meta.filename || 'resume.pdf'}"`
        });
        res.end(content);
      });
      return;
    }

    // ---- Static site ----
    if (req.method === 'GET') {
      let relPath = pathname === '/' ? '/index.html' : pathname;
      const absPath = path.normalize(path.join(PUBLIC_DIR, relPath));
      if (!absPath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      return serveStaticFile(res, absPath);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { ok: false, error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`PKSahu.com server running at http://localhost:${PORT}`);
});
