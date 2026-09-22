# Kungfu Math

Game arcade edukasi matematika untuk anak (dan dewasa).  
Latihan hitung cepat dengan gaya pendekar China kuno versi imut — mode **Slice** (geser) dan **Tap** (tekan).

Privacy-first: tanpa login, tanpa iklan di fase ini. Progress disimpan di perangkat.

## Cara menjalankan (lokal / Codespaces)

```bash
npm install
npm run dev
```

Buka di browser: **http://localhost:5173**  
Bisa juga dari HP di jaringan yang sama (pakai alamat Network yang ditampilkan Vite).

Build production (cek sebelum deploy):

```bash
npm run build
```

## Fitur saat ini

- Mode **Slice** (geser) dan **Tap** (tekan)
- 6 karakter pendekar + nama pemain opsional
- Level: Pemula → Dasar → Menengah → Mahir → Master
- Gameplay: soal matematika, nyawa, timer, skor, combo
- Tema tampilan: Siang / Malam / Nyaman Mata
- Suara: SFX + BGM (bisa mute); file audio bisa diganti di `public/sounds/`
- PWA: bisa dipasang ke layar utama HP
- Progress di **localStorage** + **kode pindah antar HP** (`KM1.…` di Pengaturan → bisa dikirim WhatsApp)
- Responsive: HP, tablet, dan laptop/PC

## Catatan

- Tidak ada backend / akun pengguna
- Ganti gambar karakter: lihat `public/characters/CARA-GANTI.txt`
- Ganti suara/musik: lihat `public/sounds/CARA-GANTI.txt`
- Footer: dukungan Trakteer + © Lim Edmon 2026

## Stack

Vite + React + TypeScript

## Author & disclaimer

**Author:** Lim Edmon (2026)

Built with AI coding assistants as development partners. The product is provided **as-is** for education and personal use — not audited for production security, payments, or sensitive data. Keep author credit if you reuse parts of this project.
