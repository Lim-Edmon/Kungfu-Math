# Kungfu Math

Game arcade edukasi matematika untuk anak (dan dewasa).  
Gabungan latihan hitung cepat + gaya pendekar China kuno versi imut.

## Cara menjalankan (lokal)

```bash
cd kungfu-math
npm install
npm run dev
```

Buka di browser: http://localhost:5173  
Bisa juga dibuka dari HP di jaringan yang sama.

## Fitur Fase 0 (saat ini)

- Pilih mode **Slice** (geser) atau **Tap** (tekan)
- 6 karakter pendekar imut (3 bersenjata + 3 tangan kosong)
- Mode tampilan: Siang / Malam / Nyaman Mata (kurangi blue light)
- Progress disimpan di localStorage (per perangkat)
- Siap untuk Export / Import progress antar HP (tanpa login)

## Rencana berikutnya

- Fase 1: Gameplay inti (soal matematika + slice/tap)
- Fase 2: Stage, skor, grade, Dojo
- Fase 3: Sound + polishing + PWA installable

## Catatan

- Semua data pemain disimpan lokal di perangkat (privacy-first)
- Belum ada backend / login
- Target: mobile-first, offline-capable
