# Cara ganti asset MVP (tanpa bongkar game)

## 1. Gambar karakter (chibi)

| Sekarang | Nanti diganti |
|----------|----------------|
| `public/characters/*.svg` | File `.png` / `.webp` hasil AI atau desainer |

**Langkah:**
1. Taruh file di `public/characters/` (contoh `hong-yi.png`)
2. Edit `src/lib/characters.ts` → field `imageSrc` jadi `'/characters/hong-yi.png'`
3. Refresh

Detail: lihat `public/characters/CARA-GANTI.txt`

---

## 2. Musik latar (BGM)

| Sekarang | Nanti diganti |
|----------|----------------|
| Nada Web Audio otomatis | `public/sounds/bgm.mp3` |

**Langkah:** taruh `bgm.mp3` di `public/sounds/` → refresh.  
Tidak perlu ubah kode.

---

## 3. Efek suara (SFX)

| Nama file | Dipakai untuk |
|-----------|----------------|
| `tap.mp3` | Ketuk angka |
| `correct.mp3` | Benar |
| `wrong.mp3` | Salah |
| `combo.mp3` | Combo |
| `finish.mp3` | Selesai |
| `select.mp3` | Pilih karakter |
| `slash.mp3` | Tebas (Slice) |
| `boom.mp3` | Bom |

Taruh di `public/sounds/` → langsung dipakai.  
Kalau file belum ada, fallback suara buatan tetap jalan.

Detail: `public/sounds/CARA-GANTI.txt`

---

## Mute

Settings → tombol suara. Berlaku untuk file audio maupun fallback.
