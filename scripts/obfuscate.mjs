/**
 * Post-build: obfuscate dist/assets/*.js
 * Membuat logika lebih sulit dibaca dari DevTools — BUKAN anti-copy 100%.
 * Aset gambar/musik tetap bisa diunduh (itu sifat web).
 *
 * Author: Lim Edmon
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'dist', 'assets');

let obfuscator;
try {
  obfuscator = (await import('javascript-obfuscator')).default;
} catch {
  console.warn(
    '[obfuscate] javascript-obfuscator belum terpasang — lewati. Jalankan: npm i -D javascript-obfuscator'
  );
  process.exit(0);
}

if (!fs.existsSync(assetsDir)) {
  console.warn('[obfuscate] dist/assets tidak ada — lewati');
  process.exit(0);
}

const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
for (const file of files) {
  const full = path.join(assetsDir, file);
  const code = fs.readFileSync(full, 'utf8');
  // Skip sangat kecil (loader)
  if (code.length < 800) continue;
  const result = obfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  });
  fs.writeFileSync(full, result.getObfuscatedCode(), 'utf8');
  console.log('[obfuscate]', file, code.length, '→', result.getObfuscatedCode().length);
}
console.log('[obfuscate] selesai');
