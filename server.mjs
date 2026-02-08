import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = Number(process.env.PORT ?? '3000')

const DIST_DIR = path.join(process.cwd(), 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(text)
}

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

  const headers = { 'Content-Type': contentType }

  // Cache hashed build artifacts aggressively; keep index.html fresh for updates.
  const base = path.basename(filePath)
  if (base === 'index.html') {
    headers['Cache-Control'] = 'no-cache'
  } else if (/-[A-Za-z0-9]{6,}\./.test(base)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  } else {
    headers['Cache-Control'] = 'public, max-age=3600'
  }

  res.writeHead(statusCode, headers)
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer((req, res) => {
  if (!req.url) return sendText(res, 400, 'Bad Request')

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return sendText(res, 405, 'Method Not Allowed')
  }

  let url
  try {
    url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  } catch {
    return sendText(res, 400, 'Bad Request')
  }

  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'

  // Prevent directory traversal
  const filePath = path.normalize(path.join(DIST_DIR, pathname))
  if (!filePath.startsWith(DIST_DIR)) return sendText(res, 403, 'Forbidden')

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      if (req.method === 'HEAD') {
        const ext = path.extname(filePath).toLowerCase()
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' })
        return res.end()
      }
      return sendFile(res, filePath)
    }

    // If the request looks like an asset (has an extension), don't SPA-fallback.
    if (path.extname(pathname)) return sendText(res, 404, 'Not Found')

    const indexPath = path.join(DIST_DIR, 'index.html')
    fs.stat(indexPath, (indexErr, indexStat) => {
      if (indexErr || !indexStat.isFile()) {
        return sendText(res, 500, 'Missing dist/index.html. Run `npm run build` before starting the server.')
      }
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end()
      }
      return sendFile(res, indexPath)
    })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`building-viz server listening on http://${HOST}:${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
