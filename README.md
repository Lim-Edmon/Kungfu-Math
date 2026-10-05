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

### Latihan bebas (mode bermain)
- Mode **Slice** (geser) dan **Tap** (tekan)
- Arena **Diam** atau **Ketangkasan** (angka bergerak)
- Submode soal: **Acak** (default) atau **Fokus** (pilih operasi + − × ÷)
- 6 karakter pendekar + nama pemain opsional
- Level: Pemula → Dasar → Menengah → Mahir → Master
- Soal matematika, nyawa, timer 60 dtk, skor, combo

### Petualangan
- Jalur **Indonesia** (Jakarta → … → Bali) lalu **Asia Tenggara** (Dili → … → Hanoi)
- Target skor per kota; lolos = buka kota berikutnya
- Peta + pin; animasi pindah kota
- Fun fact singkat saat lolos kota (tutup manual)
- Popup khusus saat mencapai **ujung jalur** saat ini
- Latar & musik per kota (opsional):
  - `public/cities/bg/{id}.webp` (atau .png / .jpg)
  - `public/cities/music/{id}.mp3`
  - Nama file = id kota (huruf kecil). Tidak ada → fallback default

### Progres & motivasi
- **Streak harian** — main berturut-turut dihitung per hari
- **Lencana** — combo, streak, kota, run sempurna, clear region
- Rekor **combo max** terpisah untuk latihan dan petualangan
- Rekor skor per level + per kota (dengan detail nama/tanggal/mode)

### Umum
- Tutorial first-play (bisa dibuka lagi di Pengaturan)
- Navigasi bawah: **Bermain · Progres · Pengaturan**
- Tema: Siang / Malam / Nyaman
- Bahasa: Indonesia / English (otomatis luar ID jika belum dipilih manual)
- SFX + BGM (bisa mute)
- PWA: pasang ke layar utama HP
- Progress **localStorage** + kode pindah antar HP (tanpa login) di **Pengaturan**
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

Prompt musik/BG: file Excel di repo / project notes (`kungfu-math-jalur-musik-kota.xlsx`).

**Polish aset** = mengganti BG/musik/karakter/logo dengan file yang lebih bagus tanpa ubah kode (cukup nama file sama).

## Catatan

- Tidak ada backend / akun pengguna
- Footer: Trakteer + © Lim Edmon 2026
- Debug pin peta (dev): `?mapdebug=1` atau `?mapdebug=1&mapzoom=2`

## Stack

Vite + React + TypeScript · Deploy: Vercel

---
