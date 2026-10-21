# Kungfu Math — Cara hitung skor & target kota

## Poin per jawaban benar

1. **Dasar:** 100 poin  
2. **Combo** (setelah jawaban pertama beruntun):  
   - Bola diam: +5 tiap tingkat combo (×2, ×3, …)  
   - Bola gerak: +10 tiap tingkat combo  
3. **Pengali** (ditumpuk / dikalikan):  

| Sumber | Nilai |
|--------|-------|
| Tempo Santai | ×1.00 |
| Tempo Ringan | ×1.05 |
| Tempo Normal | ×1.10 |
| Tempo Berani | ×1.15 |
| Bola diam | ×1.00 |
| Bola gerak | ×1.10 |
| Level Pemula | ×1.00 |
| Level Dasar | ×1.05 |
| Level Menengah | ×1.10 |
| Level Mahir | ×1.15 |
| Level Master | ×1.20 |
| Fokus hanya + / − | ×1.00 |
| Fokus campur (+/− dan ×/÷) | ×1.05 |
| Fokus hanya × / ÷ | ×1.10 |
| Latihan acak / tanpa fokus | ×1.00 |
| Slice (tebas) | ×1.00 |
| Tap (tangan kosong) | ×1.05 |

**Rumus:**  
`poin = round( (100 + bonus_combo) × tempo × level × arena × ops × speed × input )`

- **speed** = 1.1 jika jawab benar dalam < 1 detik sejak soal muncul **dan** belum salah di soal itu; selain itu 1.0

Contoh: Master + Berani + bola gerak + combo ×3 + fokus hanya kali:  
`(100 + 2×10) × 1.15 × 1.20 × 1.10 × 1.10 = round(182.556) → 183`

## Target skor kota (Petualangan)

- Kota pertama (Jakarta): **500**
- Antar kota **dalam region yang sama:** **+50**
- Kota pertama **region baru:** skor kota terakhir region sebelumnya **−100** (soft-reset), lalu +50 lagi ke kota berikutnya di region itu

Contoh: Bali (akhir Indonesia) 1150 → Dili (awal SEA) **1050**.

Ujung jalur penuh (New York) setelah soft-reset ≈ **6100** (bukan 8200 linear).

## Pause saat keluar app

Jika tab/PWA tidak terlihat (Home, app lain): permainan **dijeda** (timer berhenti, musik pause).  
Ketuk **Lanjut** untuk melanjutkan dari sisa waktu.

## Insert kota baru di region lama

Jika menambah kota di region yang sudah ada:

1. **Taruh di ujung region itu** (sebelum pindah ke region berikutnya).
2. **targetScore** = skor kota terakhir region tersebut **+50**.
3. **Kota pertama region berikutnya tidak diubah** angkanya.

Efek: jarak antar region menjadi sekitar **−150** (bukan −100), dan itu **diterima** — pemain dapat “napas” lebih longgar saat masuk kawasan baru.

Jangan sisipkan di tengah region lalu menggeser ulang semua angka target di belakangnya, kecuali ada alasan balancing besar.
