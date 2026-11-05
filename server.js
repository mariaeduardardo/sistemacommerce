import {api} from './src/api.js';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
if(process.env.NODE_ENV==='production'&&!/^https:\/\//.test(process.env.APP_ORIGIN||''))throw Error('Configure APP_ORIGIN com HTTPS antes de executar em produção.');
const root = resolve('public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const securityHeaders={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'};
const server=http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store',...securityHeaders}).end('{"status":"ok"}');return;}
    if(pathname.startsWith('/api/'))return await api(req,res,pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403,securityHeaders).end(); return; }
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', ...securityHeaders, 'Content-Security-Policy': "default-src 'self'; base-uri 'none'; form-action 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'" });
    res.end(body);
  } catch { res.writeHead(404,securityHeaders).end('Não encontrado'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');

server.requestTimeout=30000;server.headersTimeout=15000;
