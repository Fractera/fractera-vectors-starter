// 550: КРОШЕЧНЫЙ МАРШРУТИЗАТОР В ФОРМЕ EXPRESS ПОВЕРХ МАРШРУТОВ NEXT.
//
// Прежний слой данных был сервером express на 1760 строк. Переписать каждый обработчик под Request/Response — значит
// переписать проверенную логику и молча изменить ответы. Поэтому обработчики переезжают ДОСЛОВНО, а этот файл даёт им
// то, чем они пользовались: `app.get/post/…`, `app.use`, `req.params/query/body/headers/path/originalUrl/file`,
// `res.status/json/send/set/setHeader/end`. Маршрут Next отдаёт запрос в `dispatch` и получает обычный Response.
//
// Повторено поведение express, которое видно снаружи: CORS `origin: true, credentials: true` (как `cors()` прежнего
// сервера), разбор JSON-тела, HEAD по маршрутам GET, «Cannot GET /путь» (404) и «Internal Server Error» (500) там, где
// express отвечал своими страницами.
import { Readable } from 'node:stream'

function compile(path) {
  if (path instanceof RegExp) return { label: path, match: (p) => (path.test(p) ? {} : null) }
  const parts = path.split('/').filter(Boolean)
  return {
    label: path,
    match: (p) => {
      const seg = p.split('/').filter(Boolean)
      if (seg.length !== parts.length) return null
      const params = {}
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(':')) {
          try { params[parts[i].slice(1)] = decodeURIComponent(seg[i]) } catch { params[parts[i].slice(1)] = seg[i] }
        } else if (parts[i].toLowerCase() !== seg[i].toLowerCase()) return null
      }
      return params
    },
  }
}

class Res {
  constructor() {
    this.statusCode = 200
    this.headers = new Headers()
    this.body = null
    this.finished = false
  }
  status(code) { this.statusCode = code; return this }
  set(k, v) {
    if (k && typeof k === 'object') { for (const [a, b] of Object.entries(k)) this.headers.set(a, String(b)); return this }
    this.headers.set(k, String(v)); return this
  }
  setHeader(k, v) { this.headers.set(k, String(v)); return this }
  type(t) { this.headers.set('Content-Type', t.includes('/') ? t : t === 'text' ? 'text/plain; charset=utf-8' : t); return this }
  json(obj) {
    if (!this.headers.has('content-type')) this.headers.set('Content-Type', 'application/json; charset=utf-8')
    this.body = JSON.stringify(obj)
    this.finished = true
    return this
  }
  send(b) {
    if (Buffer.isBuffer(b) || b instanceof Uint8Array) {
      if (!this.headers.has('content-type')) this.headers.set('Content-Type', 'application/octet-stream')
      this.body = b
    } else if (b !== null && typeof b === 'object') {
      return this.json(b)
    } else {
      if (!this.headers.has('content-type')) this.headers.set('Content-Type', 'text/html; charset=utf-8')
      this.body = b == null ? '' : String(b)
    }
    this.finished = true
    return this
  }
  end(b) { this.body = b ?? null; this.finished = true; return this }
  redirect(code, url) { this.statusCode = code; this.headers.set('Location', url); this.finished = true; return this }
  /** Готовый Response (пересылка в соседний элемент) — отдаётся как есть. */
  respondWith(response) { this.raw = response; this.finished = true; return this }
  /** Прежнее `createReadStream(файл).pipe(res)`: поток файла становится телом ответа. */
  sendStream(nodeStream) { this.body = Readable.toWeb(nodeStream); this.finished = true; return this }
}

export function createApp() {
  const stack = []
  const add = (method) => (path, ...handlers) => { stack.push({ method, path: compile(path), handlers: handlers.flat() }); return app }
  const app = {
    stack,
    get: add('GET'), post: add('POST'), put: add('PUT'), patch: add('PATCH'), delete: add('DELETE'), all: add('ALL'),
    use: (fn) => { stack.push({ use: fn }); return app },
    // 550: пересылка в соседний элемент — тело не читается здесь, оно уходит соседу потоком.
    forward: (path, handler) => { stack.push({ method: 'ALL', path: compile(path), handlers: [handler], raw: true }); return app },
  }
  return app
}

/** Маршруты для `/capabilities` — в той же форме, что прежний перечень `app._router.stack` express. */
export function listRoutes(app) {
  const out = []
  for (const l of app.stack) {
    if (!l.path) continue
    const path = typeof l.path.label === 'string' ? l.path.label : String(l.path.label)
    out.push({ path, methods: l.method === 'ALL' ? ['_ALL'] : [l.method] })
  }
  return out
}

async function readBody(request, req) {
  const type = (request.headers.get('content-type') ?? '').toLowerCase()
  if (type.includes('application/json')) {
    const text = await request.text()
    if (!text) return
    try { req.body = JSON.parse(text) } catch { req.bodyError = true }
  } else if (type.includes('application/x-www-form-urlencoded')) {
    req.body = Object.fromEntries(new URLSearchParams(await request.text()))
  }
}

function cors(request, res) {
  const origin = request.headers.get('origin')
  if (!origin) return
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

function toResponse(res, head) {
  if (res.raw) return res.raw
  const body = head || res.statusCode === 204 || res.statusCode === 304 ? null : res.body
  return new Response(body, { status: res.statusCode, headers: res.headers })
}

/** Запрос Next → обработчики в порядке регистрации, как в express → Response. */
export async function dispatch(app, request) {
  const url = new URL(request.url)
  const head = request.method === 'HEAD'
  const method = head ? 'GET' : request.method
  const res = new Res()
  cors(request, res)

  if (request.method === 'OPTIONS' && request.headers.get('origin')) {
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
    const asked = request.headers.get('access-control-request-headers')
    if (asked) { res.setHeader('Access-Control-Allow-Headers', asked); res.setHeader('Vary', 'Origin, Access-Control-Request-Headers') }
    res.setHeader('Content-Length', '0')
    return toResponse(res.status(204), true)
  }

  const req = {
    method,
    path: url.pathname,
    originalUrl: url.pathname + url.search,
    url: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries([...request.headers].map(([k, v]) => [k.toLowerCase(), v])),
    params: {},
    body: {},
    request,
  }
  let bodyRead = false

  try {
    for (const layer of app.stack) {
      if (res.finished) break
      let params = null
      if (!layer.use) {
        if (layer.method !== 'ALL' && layer.method !== method) continue
        params = layer.path.match(req.path)
        if (!params) continue
      }
      // Тело читается, когда до него дошёл слой, которому оно нужно; пересылка соседу забирает его нетронутым потоком.
      if (!layer.raw && !bodyRead) {
        bodyRead = true
        if (!['GET', 'HEAD'].includes(request.method)) await readBody(request, req)
        if (req.bodyError) return toResponse(res.status(400).type('text/html; charset=utf-8').send('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Bad Request</pre>\n</body>\n</html>\n'), head)
      }
      if (layer.use) {
        let goOn = false
        await layer.use(req, res, () => { goOn = true })
        if (!goOn || res.finished) break
        continue
      }
      req.params = params
      let passed = true
      for (const h of layer.handlers) {
        let goOn = false
        await h(req, res, () => { goOn = true })
        if (res.finished || !goOn) { passed = false; break }
      }
      if (!passed || res.finished) break
    }
  } catch (e) {
    console.error(`[data] ${request.method} ${url.pathname}: ${String(e?.message ?? e)}`)
    return toResponse(new Res().status(500).type('text/html; charset=utf-8').send('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Internal Server Error</pre>\n</body>\n</html>\n'), head)
  }

  if (!res.finished) {
    res.status(404).type('text/html; charset=utf-8').send(`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot ${method} ${url.pathname}</pre>\n</body>\n</html>\n`)
  }
  return toResponse(res, head)
}

/**
 * Прежнее `multer({ storage: memoryStorage(), limits: { fileSize } }).single(поле)`: файл формы — в `req.file`
 * (`buffer`, `originalname`, `mimetype`, `size`), остальные поля — в `req.body`.
 */
export function uploadSingle(field, limitBytes) {
  return async (req, res, next) => {
    const type = (req.headers['content-type'] ?? '').toLowerCase()
    if (!type.includes('multipart/form-data')) return next()
    let form
    try { form = await req.request.formData() } catch (e) {
      return res.status(500).type('text/html; charset=utf-8').send(`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Error: ${String(e?.message ?? 'Malformed part header')}</pre>\n</body>\n</html>\n`)
    }
    const body = {}
    for (const [k, v] of form.entries()) {
      if (typeof v === 'string') body[k] = v
      else if (k === field) {
        if (v.size > limitBytes) {
          return res.status(500).type('text/html; charset=utf-8').send('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>MulterError: File too large</pre>\n</body>\n</html>\n')
        }
        req.file = { fieldname: k, originalname: v.name, mimetype: v.type || 'application/octet-stream', buffer: Buffer.from(await v.arrayBuffer()), size: v.size }
      }
    }
    req.body = body
    next()
  }
}

/**
 * 550: прежний адрес отвечает из соседнего элемента. Запрос уходит как есть — метод, заголовки (ключ, кука, cf-ray),
 * тело потоком, — и ответ возвращается без изменений. Соседа нет или он молчит — 503 с его адресом, как у общего хода
 * `/service/<имя>/*` (`proxy()` в platform.mjs).
 */
export function forwardTo(base, what) {
  return async (req, res) => {
    if (!base) return res.status(503).json({ error: `the ${what} element is not installed on this node` })
    const request = req.request
    const headers = new Headers(request.headers)
    for (const h of ['host', 'connection', 'content-length', 'transfer-encoding']) headers.delete(h)
    const init = { method: request.method, headers, redirect: 'manual' }
    if (!['GET', 'HEAD'].includes(request.method)) { init.body = request.body; init.duplex = 'half' }
    try {
      const r = await fetch(base + req.originalUrl, init)
      const out = new Headers(r.headers)
      // fetch уже распаковал тело: заголовки сжатия и длины относились к упакованному.
      for (const h of ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive']) out.delete(h)
      return res.respondWith(new Response(request.method === 'HEAD' ? null : r.body, { status: r.status, headers: out }))
    } catch (e) {
      return res.status(503).json({ error: `${base} did not answer: ${String(e?.message ?? e)}` })
    }
  }
}
