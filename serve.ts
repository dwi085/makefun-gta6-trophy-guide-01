// Dev-only static server for app/ (Node 22, standard library only).
// Run `node serve.ts` and open http://localhost:8080 — or pass a port with
// `--port 9000`. Nothing is built; the files are served exactly as they sit
// in app/. Do not expose this to the internet: it is a local preview tool.
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) || 8080 : 8080;

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

function safePath(rawPath) {
  const cleaned = decodeURIComponent(rawPath.split('?')[0]);
  const target = resolve(join(appRoot, cleaned === '/' ? 'index.html' : `.${cleaned}`));
  return target === appRoot || target.startsWith(`${appRoot}/`) ? target : null;
}

createServer((req, res) => {
  const target = safePath(req.url ?? '/');
  if (!target || !existsSync(target)) {
    res.writeHead(target ? 404 : 403).end(target ? 'not found' : 'forbidden');
    return;
  }
  const body = readFileSync(target);
  res.writeHead(200, {
    'content-type': contentTypes.get(extname(target)) ?? 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}).listen(port, '127.0.0.1', () => console.log(`app/ is on http://localhost:${port}`));
