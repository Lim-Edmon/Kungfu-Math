/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

export type Lang = 'id' | 'en';

const STRINGS = {
  id: {
    navLatihan: 'Latihan',
    navProgres: 'Progres',
    navPengaturan: 'Pengaturan',
    settingsTitle: 'Pengaturan',
    settingsSound: 'Suara',
    soundOn: '🔊 Suara nyala',
    soundOff: '🔇 Suara mati',
    soundNote: 'Mematikan SFX dan musik latar. Pengaturan tersimpan di HP ini.',
    settingsLanguage: 'Bahasa',
    langId: 'Indonesia',
    langEn: 'English',
    langNote:
      'Bisa diganti manual. Saat pertama kali buka dari luar Indonesia, bahasa otomatis English.',
    settingsProgress: 'Pindah Progress antar HP',
    settingsProgressNote:
      'Tanpa login / akun. Buat kode di HP ini → kirim ke HP lain → tempel kode di Settings HP tujuan.',
    btnExport: 'Buat Kode Progress',
    btnCopy: 'Salin Kode',
    btnCopied: 'Tersalin ✓',
    btnWhatsApp: 'Kirim WhatsApp',
    settingsImport: 'Masukkan Kode Progress',
    settingsImportNote: 'Tempel kode yang dimulai dengan KM1. dari HP lain.',
    btnImport: 'Masukkan Kode',
    settingsInvite: 'Ajak keluarga coba',
    settingsInviteNote:
      'Kirim ajakan ke orang tua / ponakan / sepupu supaya anak belajar hitung lewat game sederhana ini.',
    btnShare: '📤 Bagikan (WA / lain)',
    btnCopyInvite: 'Salin pesan ajakan',
    settingsPrivacy: 'Privasi',
    settingsPrivacyNote:
      'Progress disimpan di HP ini saja (localStorage). Tidak ada login, tidak ada kirim data ke server.',
    settingsSupport: 'Saran & Dukung',
    settingsSupportNote:
      'Suka mainnya atau punya saran? Bisa dukung lewat Trakteer. Tulis pesan di kolom Trakteer (saran & feedback boleh).',
    btnTrakteer: '☕ Buka Trakteer',
    footerSupport: '☕ Dukung project ini',
    levelTitle: 'Level permainan',
    levelHint: 'Seberapa sulit soal matematikanya',
    startPlay: 'Mulai Bermain',
    back: 'Kembali',
    next: 'Lanjut',
    exit: 'Keluar',
    dojoTitle: 'Progres',
    dojoSub: 'Rekor & progress kamu',
    knowTitle: 'Tahukah kamu?',
    celebratePass: 'Kamu lolos!',
    newRecord: 'Rekor baru!',
    timeUp: 'Waktu habis',
    wellDone: 'Kerja bagus!',
  },
  en: {
    navLatihan: 'Practice',
    navProgres: 'Progress',
    navPengaturan: 'Settings',
    settingsTitle: 'Settings',
    settingsSound: 'Sound',
    soundOn: '🔊 Sound on',
    soundOff: '🔇 Sound off',
    soundNote: 'Mutes SFX and background music. Saved on this device.',
    settingsLanguage: 'Language',
    langId: 'Indonesia',
    langEn: 'English',
    langNote:
      'You can change this anytime. On first visit from outside Indonesia, English is selected automatically.',
    settingsProgress: 'Move progress between devices',
    settingsProgressNote:
      'No login. Create a code here → send to another phone → paste it in Settings there.',
    btnExport: 'Create Progress Code',
    btnCopy: 'Copy Code',
    btnCopied: 'Copied ✓',
    btnWhatsApp: 'Send WhatsApp',
    settingsImport: 'Enter Progress Code',
    settingsImportNote: 'Paste a code starting with KM1. from another device.',
    btnImport: 'Import Code',
    settingsInvite: 'Invite family to try',
    settingsInviteNote:
      'Share with parents / relatives so kids can practice mental math through a simple game.',
    btnShare: '📤 Share (WA / other)',
    btnCopyInvite: 'Copy invite message',
    settingsPrivacy: 'Privacy',
    settingsPrivacyNote:
      'Progress stays on this device only (localStorage). No login, no server upload.',
    settingsSupport: 'Feedback & Support',
    settingsSupportNote:
      'Enjoying it or have ideas? Support via Trakteer — you can leave a note there.',
    btnTrakteer: '☕ Open Trakteer',
    footerSupport: '☕ Support this project',
    levelTitle: 'Difficulty',
    levelHint: 'How hard the math questions are',
    startPlay: 'Start Playing',
    back: 'Back',
    next: 'Next',
    exit: 'Exit',
    dojoTitle: 'Progress',
    dojoSub: 'Your records & progress',
    knowTitle: 'Did you know?',
    celebratePass: 'City cleared!',
    newRecord: 'New record!',
    timeUp: 'Time is up',
    wellDone: 'Well done!',
  },
} as const;

export type StringKey = keyof typeof STRINGS.id;

let currentLang: Lang = 'id';

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  try {
    document.documentElement.lang = lang === 'en' ? 'en' : 'id';
  } catch {
    /* ignore */
  }
}

export function t(key: StringKey): string {
  return STRINGS[currentLang][key] ?? STRINGS.id[key] ?? key;
}

/** Deteksi otomatis: di luar Indonesia → English */
export function detectLangFromDevice(): Lang {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const idTz = [
      'Asia/Jakarta',
      'Asia/Pontianak',
      'Asia/Makassar',
      'Asia/Jayapura',
    ];
    if (idTz.includes(tz)) return 'id';
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('id')) return 'id';
    // timezone bukan ID & bahasa browser bukan id → English
    return 'en';
  } catch {
    return 'id';
  }
}
