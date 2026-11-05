# Kungfu Math

Game arcade edukasi matematika untuk anak (dan dewasa).  
Latihan hitung cepat bergaya pendekar China kuno versi imut.

**Main online:** [https://kungfu-math.vercel.app/](https://kungfu-math.vercel.app/)

**Ownership / no reverse-engineering:** lihat [NOTICE.txt](public/NOTICE.txt) dan [LICENSE](LICENSE) (English). Kolaborasi / izin: [Trakteer](https://trakteer.id/lim.edmon).

Privacy-first: tanpa login, tanpa iklan di fase ini. Progress disimpan di perangkat (localStorage).

---

## Cara menjalankan (lokal / Codespaces)

```bash
npm install
npm run dev
```

Buka browser: **http://localhost:5173**  
Dari HP di jaringan yang sama: pakai alamat Network yang ditampilkan Vite.

Build production:

```bash
npm run build
```

(Pipeline: Vite build → obfuscate → verifikasi `dist`.)  
Deploy: push branch `main` ke GitHub → Vercel build otomatis.

---

## Fitur

### Cara main (input)

| Mode | Arti |
|------|------|
| **Slice** | Geser / tebas angka |
| **Tap** | Tekan angka (tangan kosong) |

6 karakter pendekar (3 bersenjata Slice, 3 tangan kosong Tap) + nama pemain opsional.

### Arena (gerak bola)

| Mode | ID internal | Arti |
|------|-------------|------|
| **Diam** | `static` | Angka diam di tempat |
| **Pantul** | `agility` | Angka bergerak, pantul dinding & antar bola |
| **Lewat** | `pass` | Angka melintas kiri↔kanan; yang lewat tepi diganti gelombang baru |

### Bentuk sesi latihan

| Sesi | Arti |
|------|------|
| **Grade** | 60 detik, kejar skor tertinggi |
| **Sprint** | Selesaikan N soal secepat mungkin (pilihan 5 / 10 soal) |

Berlaku bersama level, arena, Slice/Tap, dan submode soal.

### Level soal & submode

- Level: **Pemula → Dasar → Menengah → Mahir → Master**
- Submode: **Acak** (semua operasi sesuai level) atau **Fokus** (pilih + − × ÷; opsi mengikuti level)
- Nyawa, combo, skor dengan pengali (tempo / level / arena / fokus / Slice–Tap / jawab cepat) — detail: [docs/SCORING.md](docs/SCORING.md)

### Petualangan

- Rute dunia ber-region (Indonesia → Asia Tenggara → Oseania → Asia Timur → … → Amerika Serikat).
- Ujung jalur yang **bisa dimainkan** mengikuti gate aset di kode (`CONTENT_PATH_LAST_CITY_ID` — hanya kota berurutan yang punya BG + musik).
- Ujung data jalur penuh: **New York**. Jalur misteri (kutub) = catatan awal / syarat ketat, bukan konten utama.
- Target skor per kota; lolos membuka kota berikutnya (+50 dalam region; soft-reset −100 di kota pertama region baru).
- Peta + pin, animasi pesawat pindah kota, fun fact (ID/EN) saat lolos.
- Tempo perjalanan: Santai / Ringan / Normal / Berani (pengaruh waktu & pengali skor).
- Latar & musik per kota (opsional):

| Jenis | Path |
|-------|------|
| Background | `public/cities/bg/{id}.webp` (atau `.png` / `.jpg`) |
| Musik | `public/cities/music/{id}.mp3` |

Nama file = **id kota** (huruf kecil). Tidak ada → fallback default / BGM menu.

### Progres & motivasi

- Streak harian
- Lencana (combo, streak, kota, run sempurna, region, …)
- Rekor combo max terpisah (latihan vs petualangan)
- Rekor skor per level & per kota (nama, tanggal, mode, arena, tempo)
- Kode **export / import** progress antar HP (Pengaturan) — tanpa login; bisa tempel pesan WA utuh

### Umum

- Tutorial first-play (bisa dibuka lagi di Pengaturan)
- Nav bawah: **Bermain · Progres · Pengaturan**
- Tema tampilan: Siang / Malam / Nyaman
- Bahasa: Indonesia / English (otomatis luar ID jika belum dipilih manual)
- SFX + BGM (bisa mute); pause + mute saat app di background
- Offline terbatas: latihan arena **Diam** saja; petualangan & fitur online dinonaktifkan dengan pesan jelas
- PWA installable
- Responsive: HP, tablet, laptop/PC
- Nama negara di UI selalu **lengkap** (bukan kode ISO)
- Tema musiman (Natal / Imlek / Lebaran) otomatis di jendela tanggal; irisan pakai pola gabungan

---

## Ganti aset

| Aset | Folder / file |
|------|----------------|
| Karakter | `public/characters/` |
| BG kota | `public/cities/bg/{id}.…` |
| Musik kota | `public/cities/music/{id}.mp3` |
| Pola season | `public/seasons/*.webp` |
| Logo / PWA icons | `public/logo.png`, `icon-*.png`, … |

Panduan singkat: `CARA-GANTI-ASSET.md`, `public/cities/CARA-GANTI.txt`.

---

## Debug & tes (developer)

### Peta & koordinat

```
?mapdebug=1
```

- Semua kota terlihat untuk cek pin / aset (tanpa “main” normal).
- Klik peta → salin `mapX` / `mapY`; drag + zoom ±50% / ketik %.
- Status file BG & musik per kota.
- Opsional: `&mapfocus=jakarta`, `&mapzoom=…`, `&mapcenter=x,y`
- Alias: `?advdebug=1`
- Detail: `public/cities/CARA-DEBUG-PETA.txt`

### Tema musiman (paksa, tanpa tunggu tanggal)

| Query | Efek |
|-------|------|
| `?season=natal` | Pola Natal |
| `?season=imlek` | Pola Imlek |
| `?season=lebaran` | Pola Lebaran |
| `?season=natal-lebaran` | Irisan Natal+Lebaran |
| `?season=imlek-lebaran` | Irisan Imlek+Lebaran |
| `?season=off` | Paksa netral |

Jendela Imlek/Lebaran hardcode ~2025–2050; Natal otomatis 25 Nov–6 Jan tiap tahun. Di luar jendela = netral (tidak “ngaco” di tahun tanpa data).

### Kode buka-semua (uji)

**Tidak dipublikasikan di README.** Hanya catatan internal / Codespace. Jangan bagikan ke pemain.

---

## Skor & balancing

Lihat **[docs/SCORING.md](docs/SCORING.md)** — pengali tempo / level / arena / fokus / input, combo, soft-reset region, pause saat keluar app, aturan insert kota baru.

---

## Stack & catatan

- **Stack:** Vite + React + TypeScript · deploy Vercel · build + obfuscation production
- **Tanpa** backend / akun pengguna
- Footer: dukungan (Trakteer / Ko-fi) + © Lim Edmon 2026
- Notice kepemilikan: `public/NOTICE.txt`, `robots.txt`, halaman notice

---

## Kontribusi / izin

Kode dan aset untuk proyek ini. Dilarang menyalin / reverse-engineer / mengekstrak untuk klon komersial tanpa izin.  
Minat kolaborasi: saluran di [Trakteer lim.edmon](https://trakteer.id/lim.edmon).
