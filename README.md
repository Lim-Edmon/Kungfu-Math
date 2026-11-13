# Kungfu Math

Game arcade edukasi matematika untuk anak (dan dewasa).  
Latihan hitung cepat bergaya pendekar China kuno versi imut.

**Main online:** [https://kungfu-math.vercel.app/](https://kungfu-math.vercel.app/)

**Ownership / no reverse-engineering:** lihat [NOTICE.txt](public/NOTICE.txt) dan [LICENSE](LICENSE) (English). Kolaborasi / izin: [Trakteer](https://trakteer.id/lim.edmon).

Privacy-first: tanpa login, tanpa iklan di fase ini. Progress disimpan di perangkat (localStorage) + export/import kode.

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

6 karakter pendekar + nama pemain opsional:

| Karakter | Mode | Senjata |
|----------|------|---------|
| **Yu Jin** | Slice | Tombak |
| **Hong Yi** | Slice | Tongkat |
| **Ming Zhe** | Slice | Pedang |
| **Yo Rin** | Tap | Tangan kosong |
| **An Ning** | Tap | Tangan kosong |
| **Zhi Xing** | Tap | Tangan kosong |

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

- Rute dunia ber-region, urutan:
  **Indonesia → SEA → Oseania → Asia Timur → Asia Selatan/Tengah → Timur Tengah → Afrika → Eropa Timur → Eropa Utara → Eropa Tengah/Barat → Eropa Selatan → Amerika Selatan → Amerika Tengah → Kanada/Utara → Amerika Serikat → (Jalur Misteri Kutub)**
- Ujung jalur yang **bisa dimainkan** mengikuti gate aset di kode (`CONTENT_PATH_LAST_CITY_ID`). Saat ini: **`galapagos`** (hanya kota berurutan yang punya BG + musik lengkap).
- Ujung data jalur penuh (tanpa misteri): **New York** (target 6150).
- Target skor: **+50** per kota dalam region; **−100** di kota pertama region baru.
- Peta + pin, animasi pesawat pindah kota, fun fact (ID/EN) saat lolos.
- Tempo perjalanan: Santai / Ringan / Normal / Berani (pengaruh waktu & pengali skor).
- Latar & musik per kota:

| Jenis | Path | Standar |
|-------|------|---------|
| Background | `public/cities/bg/{id}.webp` (fallback `.jpg` / `.png`) | WebP, lebar ≤1600 |
| Musik | `public/cities/music/{id}.mp3` | mono, 22050 Hz, 64 kbps, max 60 dtk |

Nama file = **id kota** (huruf kecil). Tidak ada → fallback default / BGM menu.

### Animasi serangan (HUD)

Semua 6 karakter memakai **GIF** di kotak foto HUD (bukan rangkaian frame PNG):

| File | Kapan |
|------|--------|
| `public/characters/anim/{id}/attack.gif` | Jawaban **benar** → play ~2 dtk (`ATTACK_ANIM_MS = 2000`) |
| `public/characters/anim/{id}/idle.png` | Idle / miss → diam |

Benar berikutnya sebelum animasi selesai → animasi **restart** dari awal (key React diganti).  
GIF mengisi kotak foto (tinggi = box; lebar center, boleh kepotong kiri/kanan). Tidak perlu background transparan.

(File `f01.png`…`f12.png` lama di folder `yu-jin` / `yo-rin` **tidak dipakai** kode lagi — boleh dihapus saat rapi-rapi repo.)

### Jalur Misteri (region rahasia / kutub)

- Tersembunyi total sampai **New York** lolos target → popup discovery.
- Setelah terbuka, **Kutub Utara & Kutub Selatan terbuka bersamaan** (bukan sekuens); user pilih mana dulu.
- Target masing-masing **7500** (challenge murni, bukan lanjutan skor NY).
- Lolos **kedua** kutub → lencana **Greatest Explorer All Time** (baru muncul setelah region terbuka).
- Arena kutub: efek **salju turun** (CSS overlay, `pointer-events: none` — bola tetap bisa di-slice/tap).

BG/musik: `public/cities/bg/north-pole.*`, `south-pole.*` + musik matching.

### Progres & motivasi

- Streak harian
- Lencana (combo, streak, kota, run sempurna, region explorer, Greatest Explorer All Time, …)
- Rekor combo max terpisah (latihan vs petualangan)
- Rekor skor per level & per kota (nama, tanggal, mode, arena, tempo)
- Kode **export / import** progress antar HP (Pengaturan) — tanpa login; bisa tempel pesan WA utuh
- Migrasi jalur: progress lama dinormalisasi ke jalur baru (kontigu dari awal sampai gap)

### Umum

- Tutorial first-play (bisa dibuka lagi di Pengaturan)
- Nav bawah: **Latihan · Dojo · Atur**
- Tema tampilan: Siang / Malam / Nyaman Mata
- Bahasa: Indonesia / English (otomatis luar ID jika belum dipilih manual)
- SFX + BGM (bisa mute); pause + mute saat app di background
- Offline terbatas: latihan arena **Diam** saja; petualangan & fitur online dinonaktifkan dengan pesan jelas
- PWA installable
- Responsive: HP, tablet, laptop/PC
- Nama negara di UI selalu **lengkap** (bukan kode ISO) — map di `COUNTRY_NAMES_ID` + `getCountryNameId()`
- Tema musiman (Natal / Imlek / Lebaran) otomatis di jendela tanggal; irisan pakai pola gabungan

---

## Ganti aset

| Aset | Folder / file |
|------|----------------|
| Karakter (full / close-up) | `public/characters/` |
| Anim serangan | `public/characters/anim/{id}/attack.gif` + `idle.png` |
| BG kota | `public/cities/bg/{id}.webp` |
| Musik kota | `public/cities/music/{id}.mp3` (mono 22050 Hz 64 kbps ≤60s) |
| Pola season | `public/seasons/*.webp` |
| Logo / PWA icons | `public/logo.png`, `icon-*.png`, … |

Panduan singkat: `CARA-GANTI-ASSET.md`, `public/cities/CARA-GANTI.txt`.

Referensi jalur kota (koordinat, target, prompt aset): spreadsheet di repo / artefak `kungfu-math-jalur-kota-lengkap.xlsx`.

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

Jendela Imlek/Lebaran hardcode ~2025–2050; Natal otomatis 25 Nov–6 Jan tiap tahun. Di luar jendela = netral.

### Kode buka-semua (uji)

**Tidak dipublikasikan di README.** Hanya catatan internal / Codespace. Jangan bagikan ke pemain.

---

## Skor & balancing

Lihat **[docs/SCORING.md](docs/SCORING.md)** — pengali tempo / level / arena / fokus / input, combo, soft-reset region (−100), pause saat keluar app, aturan insert kota baru.

Ringkas target petualangan:
- Dalam region: **+50** per kota
- Ganti region: kota pertama = skor kota terakhir region sebelumnya **− 100**
- New York: **6150**
- Kutub Utara & Selatan: **7500** masing-masing (challenge)

---

## Stack & catatan

- **Stack:** Vite + React + TypeScript · deploy Vercel · build + obfuscation production
- **Tanpa** backend / akun pengguna
- Footer: dukungan (Trakteer lim.edmon / Ko-fi) + © Lim Edmon 2026
- Notice kepemilikan: `public/NOTICE.txt`, `robots.txt`, halaman notice

---

## Kontribusi / izin

Kode dan aset untuk proyek ini. Dilarang menyalin / reverse-engineer / mengekstrak untuk klon komersial tanpa izin.  
Minat kolaborasi: saluran di [Trakteer lim.edmon](https://trakteer.id/lim.edmon).
