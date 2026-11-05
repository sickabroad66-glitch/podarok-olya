import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRange } from './http-utils.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = await realpath(resolve(project, process.argv.includes('--dist') ? 'dist' : 'site'));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.txt': 'text/plain; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const parts = pathname.split('/');
    if (pathname.includes('\0') || parts.some(part => part.startsWith('.'))) throw new Error('Blocked path');
    const candidate = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!candidate.startsWith(root + sep)) throw new Error('Blocked path');
    const file = await realpath(candidate);
    if (!file.startsWith(root + sep)) throw new Error('Blocked symlink');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const range = parseRange(req.headers.range, info.size);
    if (range === false) {
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
      res.end();
      return;
    }
    const start = range?.start ?? 0;
    const end = range?.end ?? info.size - 1;
    const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': range ? end - start + 1 : info.size, 'Accept-Ranges': 'bytes' };
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD' || info.size === 0) res.end();
    else createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Страница не найдена');
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
