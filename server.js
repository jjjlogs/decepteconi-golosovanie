/**
 * DECEPTICON AWARDS — сервер голосования.
 * Чистый Node.js, без внешних зависимостей.
 *
 * Особенности этой версии:
 *  - результаты (счётчики голосов) НИКОГДА не отдаются публичному API —
 *    пользователи не видят, кто лидирует;
 *  - можно отменить свой голос в категории (POST /api/unvote);
 *  - в каждой категории можно вписать свой вариант ответа вместо
 *    выбора из списка.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'nominees.json');
const VOTERS_FILE = path.join(__dirname, 'data', 'voters.json');
const CUSTOM_FILE = path.join(__dirname, 'data', 'custom-entries.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

// ---------- Хранилище ----------
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
function readVoters() {
  if (!fs.existsSync(VOTERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(VOTERS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}
function writeVoters(v) {
  fs.writeFileSync(VOTERS_FILE, JSON.stringify(v, null, 2), 'utf-8');
}
function readCustom() {
  if (!fs.existsSync(CUSTOM_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf-8'));
  } catch {
    return {};
  }
}
function writeCustom(c) {
  fs.writeFileSync(CUSTOM_FILE, JSON.stringify(c, null, 2), 'utf-8');
}

// ---------- Cookies ----------
function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}
function getOrCreateVoterId(req, res) {
  const cookies = parseCookies(req);
  let voterId = cookies.voter_id;
  if (!voterId) {
    voterId = crypto.randomBytes(16).toString('hex');
    const maxAge = 60 * 60 * 24 * 365;
    res.setHeader(
      'Set-Cookie',
      `voter_id=${voterId}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`
    );
  }
  return voterId;
}

// ---------- JSON body ----------
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

// ---------- Статика ----------
function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Не найдено');
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- Публичное представление категорий (БЕЗ счётчиков голосов) ----------
function publicCategories(data) {
  return data.map((cat) => ({
    id: cat.id,
    title: cat.title,
    subtitle: cat.subtitle || '',
    allowCustom: !!cat.allowCustom,
    options: cat.options.map((o) => ({ id: o.id, label: o.label })),
  }));
}

// ---------- API ----------
function handleGetCategories(req, res, voterId) {
  const data = readData();
  const voters = readVoters();
  const myVotes = voters[voterId] || {};
  sendJson(res, 200, { categories: publicCategories(data), myVotes });
}

async function handlePostVote(req, res, voterId) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Некорректный JSON' });
  }

  const { categoryId, optionId, customText } = body;
  if (!categoryId || (!optionId && !customText)) {
    return sendJson(res, 400, { error: 'Нужно указать categoryId и optionId или customText' });
  }

  const voters = readVoters();
  const myVotes = voters[voterId] || {};

  if (myVotes[categoryId]) {
    return sendJson(res, 409, {
      error: 'Вы уже голосовали в этой номинации. Сначала отмените голос.',
      votedFor: myVotes[categoryId],
    });
  }

  const data = readData();
  const category = data.find((c) => c.id === categoryId);
  if (!category) return sendJson(res, 404, { error: 'Категория не найдена' });

  if (customText) {
    const text = String(customText).trim().slice(0, 200);
    if (!text) return sendJson(res, 400, { error: 'Пустой вариант ответа' });
    if (!category.allowCustom) {
      return sendJson(res, 400, { error: 'В этой категории нельзя вписать свой вариант' });
    }
    const customEntries = readCustom();
    if (!customEntries[categoryId]) customEntries[categoryId] = [];
    customEntries[categoryId].push({ voterId, text, ts: Date.now() });
    writeCustom(customEntries);

    myVotes[categoryId] = { type: 'custom', text };
    voters[voterId] = myVotes;
    writeVoters(voters);

    return sendJson(res, 200, { ok: true, myVotes });
  }

  const option = category.options.find((o) => o.id === optionId);
  if (!option) return sendJson(res, 404, { error: 'Вариант не найден' });

  option.votes += 1;
  writeData(data);

  myVotes[categoryId] = { type: 'option', optionId: option.id, label: option.label };
  voters[voterId] = myVotes;
  writeVoters(voters);

  sendJson(res, 200, { ok: true, myVotes });
}

async function handlePostUnvote(req, res, voterId) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Некорректный JSON' });
  }

  const { categoryId } = body;
  if (!categoryId) return sendJson(res, 400, { error: 'categoryId обязателен' });

  const voters = readVoters();
  const myVotes = voters[voterId] || {};
  const existing = myVotes[categoryId];

  if (!existing) {
    return sendJson(res, 409, { error: 'В этой номинации вы ещё не голосовали' });
  }

  if (existing.type === 'option') {
    const data = readData();
    const category = data.find((c) => c.id === categoryId);
    const option = category && category.options.find((o) => o.id === existing.optionId);
    if (option && option.votes > 0) option.votes -= 1;
    writeData(data);
  } else if (existing.type === 'custom') {
    const customEntries = readCustom();
    if (customEntries[categoryId]) {
      customEntries[categoryId] = customEntries[categoryId].filter(
        (e) => !(e.voterId === voterId && e.text === existing.text)
      );
      writeCustom(customEntries);
    }
  }

  delete myVotes[categoryId];
  voters[voterId] = myVotes;
  writeVoters(voters);

  sendJson(res, 200, { ok: true, myVotes });
}

// ---------- Роутинг ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const voterId = getOrCreateVoterId(req, res);

  try {
    if (pathname === '/api/categories' && req.method === 'GET') {
      return handleGetCategories(req, res, voterId);
    }
    if (pathname === '/api/vote' && req.method === 'POST') {
      return await handlePostVote(req, res, voterId);
    }
    if (pathname === '/api/unvote' && req.method === 'POST') {
      return await handlePostUnvote(req, res, voterId);
    }
    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'Неизвестный маршрут' });
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Внутренняя ошибка сервера' });
  }
});

server.listen(PORT, () => {
  console.log(`🤖 DECEPTICON AWARDS запущен: http://localhost:${PORT}`);
});
