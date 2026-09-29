# Kungfu Math

Game arcade edukasi matematika untuk anak (dan dewasa).  
Latihan hitung cepat dengan gaya pendekar China kuno versi imut — mode **Slice** (geser) dan **Tap** (tekan).

**Main online:** [https://kungfu-math.vercel.app/](https://kungfu-math.vercel.app/)

Privacy-first: tanpa login, tanpa iklan di fase ini. Progress disimpan di perangkat.

## Cara menjalankan (lokal / Codespaces)

```bash
npm install
npm run dev
```

Buka di browser: **http://localhost:5173**  
Bisa juga dari HP di jaringan yang sama (alamat Network dari Vite).

Build production:

```bash
npm run build
```

Deploy: push ke GitHub → Vercel otomatis build.

## Fitur saat ini

### Latihan
- Mode **Slice** (geser) dan **Tap** (tekan)
- Arena **Diam** atau **Ketangkasan** (angka bergerak)
- 6 karakter pendekar + nama pemain opsional
- Level: Pemula → Dasar → Menengah → Mahir → Master
- Soal matematika, nyawa, timer 60 dtk, skor, combo

### Petualangan
- Jalur **Indonesia** (Jakarta → … → Bali) lalu **Asia Tenggara** (Dili → … → Hanoi)
- Target skor per kota; lolos = buka kota berikutnya
- Peta + pin; animasi pindah kota
- Fun fact singkat saat lolos kota (tutup manual)
- Latar & musik per kota (opsional):
  - `public/cities/bg/{id}.webp` (atau .png / .jpg)
  - `public/cities/music/{id}.mp3`
  - Nama file = id kota (huruf kecil). Tidak ada → fallback default

### Umum
- Navigasi bawah: **Latihan · Dojo · Atur**
- Dojo: rekor per level + rekor per kota petualangan
- Tema: Siang / Malam / Nyaman
- SFX + BGM (bisa mute)
- PWA: pasang ke layar utama HP
- Progress **localStorage** + kode pindah antar HP (tanpa login) di **Atur**
- Responsive: HP, tablet, laptop/PC
- Nama negara di UI selalu lengkap (bukan kode ISO)

## Ganti aset

| Aset | Folder |
|------|--------|
| Karakter | `public/characters/` + `CARA-GANTI.txt` |
| SFX / BGM default | `public/sounds/` |
| Latar kota | `public/cities/bg/{id}.webp` |
| Musik kota | `public/cities/music/{id}.mp3` (ideal ~12 dtk, loop) |
| Peta dunia | `public/cities/map/` |

Prompt musik/BG: file Excel `kungfu-math-jalur-musik-kota.xlsx`.

## Catatan

- Tidak ada backend / akun pengguna
- Footer: Trakteer + © Lim Edmon 2026
- Debug pin peta (dev): `?mapdebug=1` atau `?mapdebug=1&mapzoom=2`

## Stack

Vite + React + TypeScript · Deploy: Vercel

## Author & disclaimer

**Author:** Lim Edmon (2026)

Built with AI coding assistants as development partners. The product is provided **as-is** for education and personal use — not audited for production security, payments, or sensitive data. Keep author credit if you reuse parts of this project.
