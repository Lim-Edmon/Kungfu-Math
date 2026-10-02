/**
 * Verifikasi hasil build sebelum deploy.
 * Author: Lim Edmon
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const errors = [];

function fail(msg) {
  errors.push(msg);
  console.error('[verify]', msg);
}

if (!fs.existsSync(dist)) {
  fail('folder dist/ tidak ada');
} else {
  const indexPath = path.join(dist, 'index.html');
  if (!fs.existsSync(indexPath)) fail('dist/index.html tidak ada');
  else {
    const html = fs.readFileSync(indexPath, 'utf8');
    const assetRefs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
      (m) => m[1]
    );
    if (assetRefs.length === 0) fail('index.html tidak mereferensikan /assets/*');
    for (const ref of assetRefs) {
      const file = path.join(dist, ref.replace(/^\//, ''));
      if (!fs.existsSync(file)) fail(`asset hilang: ${ref}`);
    }
  }

  const assetsDir = path.join(dist, 'assets');
  if (!fs.existsSync(assetsDir)) fail('dist/assets/ tidak ada');
  else {
    const js = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    if (js.length === 0) fail('tidak ada file .js di dist/assets/');
    else console.log('[verify] JS bundles:', js.join(', '));
  }

  // Smoke: pastikan string penting masih ada di bundle (obfuscate boleh acak nama, tapi path asset sering tetap)
  const sw = path.join(dist, 'sw.js');
  if (fs.existsSync(sw)) {
    const swText = fs.readFileSync(sw, 'utf8');
    if (!/kungfu-math-/.test(swText) && !/CACHE/.test(swText)) {
      console.warn('[verify] sw.js ada tapi pola cache tidak dikenali (cek manual)');
    } else {
      console.log('[verify] sw.js OK');
    }
  } else {
    console.warn('[verify] sw.js tidak di-copy ke dist (cek public/sw.js)');
  }
}

if (errors.length) {
  console.error(`[verify] GAGAL (${errors.length} masalah)`);
  process.exit(1);
}
console.log('[verify] OK — dist siap deploy');
