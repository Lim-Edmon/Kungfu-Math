/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect } from 'react';
import {
  loadProgress,
  updateProgress,
  exportProgress,
  importProgress,
} from '../lib/storage';
import { TRAKTEER_URL, APP_URL, buildInviteText } from '../lib/constants';
import { t, getLang, setLang, type Lang } from '../lib/i18n';

interface SettingsProps {
  onBack: () => void;
  onLangChange?: () => void;
}

export default function Settings({
  onBack: _onBack,
  onLangChange,
}: SettingsProps) {
  const [soundMuted, setSoundMuted] = useState(false);
  const [lang, setLangLocal] = useState<Lang>('id');
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setSoundMuted(p.soundMuted);
    setLangLocal(p.language || getLang());
  }, []);

  const handleMuteToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    updateProgress({ soundMuted: next });
    setMessage(next ? t('soundOff') : t('soundOn'));
  };

  const handleLang = (next: Lang) => {
    setLangLocal(next);
    setLang(next);
    updateProgress({ language: next, languageChosen: true });
    onLangChange?.();
    setMessage(next === 'en' ? 'Language: English' : 'Bahasa: Indonesia');
  };

  const handleExport = () => {
    const code = exportProgress();
    setExportCode(code);
    setMessage('Kode siap — salin atau kirim WhatsApp ke HP lain');
  };

  const handleCopy = async () => {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setMessage('Kode disalin! Tempel di Settings HP lain.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage('Gagal menyalin otomatis. Pilih teks di bawah lalu salin manual.');
    }
  };

  const handleWhatsApp = () => {
    if (!exportCode) {
      handleExport();
      return;
    }
    const text = encodeURIComponent(
      `Kode progress Kungfu Math saya:\n\n${exportCode}\n\nBuka game → ⚙️ Pengaturan → Masukkan Kode Progress`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      setMessage('Tempel kode progress dulu');
      return;
    }
    const ok = importProgress(importCode);
    if (ok) {
      setMessage('Progress berhasil dimasukkan! Kembali ke Home untuk melihat.');
      setImportCode('');
    } else {
      setMessage('Kode tidak valid. Pastikan salin utuh dari HP lain (mulai KM1.).');
    }
  };

  const handleShareInvite = async () => {
    const text = buildInviteText();
    // Web Share API (HP modern) — buka sheet WA / Telegram / dll
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Kungfu Math',
          text,
          url: APP_URL,
        });
        setMessage('Siap dibagikan!');
        return;
      } catch (err) {
        // User batal share → jangan error keras; fallback di bawah
        if (err instanceof DOMException && err.name === 'AbortError') {
          setMessage('Bagikan dibatalkan');
          return;
        }
      }
    }
    // Fallback: WhatsApp Web/App
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setMessage('Membuka WhatsApp dengan pesan ajakan…');
  };

  const handleCopyInvite = async () => {
    const text = buildInviteText();
    try {
      await navigator.clipboard.writeText(text);
      setInviteCopied(true);
      setMessage('Pesan ajakan disalin — tempel di WA / chat keluarga');
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setMessage('Gagal menyalin. Coba Bagikan lewat WhatsApp.');
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>{t('settingsTitle')}</h1>
      </header>

      <section className="settings-section">
        <h2>{t('settingsSound')}</h2>
        <button
          type="button"
          className={`settings-toggle ${soundMuted ? '' : 'active'}`}
          onClick={handleMuteToggle}
        >
          {soundMuted ? t('soundOff') : t('soundOn')}
        </button>
        <p className="settings-note">{t('soundNote')}</p>
      </section>

      <section className="settings-section">
        <h2>{t('settingsLanguage')}</h2>
        <div className="export-actions settings-lang-actions">
          <button
            type="button"
            className={`settings-toggle ${lang === 'id' ? 'active' : ''}`}
            onClick={() => handleLang('id')}
          >
            {t('langId')}
          </button>
          <button
            type="button"
            className={`settings-toggle ${lang === 'en' ? 'active' : ''}`}
            onClick={() => handleLang('en')}
          >
            {t('langEn')}
          </button>
        </div>
        <p className="settings-note">{t('langNote')}</p>
      </section>

      <section className="settings-section">
        <h2>{t('settingsProgress')}</h2>
        <p className="settings-note">
          Tanpa login / akun. Buat kode di HP ini → kirim ke HP lain → tempel
          kode di Settings HP tujuan. Progress (skor, nama, preferensi) ikut
          pindah.
        </p>
        <button type="button" className="btn-primary" onClick={handleExport}>
          Buat Kode Progress
        </button>
        {exportCode && (
          <div className="export-box">
            <textarea
              className="code-area"
              readOnly
              value={exportCode}
              rows={4}
              onFocus={(e) => e.target.select()}
            />
            <div className="export-actions">
              <button type="button" className="btn-secondary" onClick={handleCopy}>
                {copied ? 'Tersalin ✓' : 'Salin Kode'}
              </button>
              <button type="button" className="btn-primary" onClick={handleWhatsApp}>
                Kirim WhatsApp
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Masukkan Kode Progress</h2>
        <p className="settings-note">
          Tempel kode yang dimulai dengan <strong>KM1.</strong> dari HP lain.
        </p>
        <textarea
          className="code-area"
          placeholder="KM1.eyJ..."
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          rows={4}
        />
        <button type="button" className="btn-primary" onClick={handleImport}>
          Masukkan Kode
        </button>
      </section>

      <section className="settings-section">
        <h2>Ajak keluarga coba</h2>
        <p className="settings-note">
          Kirim ajakan ke orang tua / ponakan / sepupu supaya anak belajar
          hitung lewat game sederhana ini.
        </p>
        <div className="export-actions settings-share-actions">
          <button type="button" className="btn-primary" onClick={handleShareInvite}>
            📤 Bagikan (WA / lain)
          </button>
          <button type="button" className="btn-secondary" onClick={handleCopyInvite}>
            {inviteCopied ? 'Tersalin ✓' : 'Salin pesan ajakan'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Privasi</h2>
        <p className="settings-note">
          Progress disimpan di HP ini saja (localStorage). Tidak ada login,
          tidak ada kirim data ke server.
        </p>
      </section>

      <section className="settings-section">
        <h2>Saran & Dukung</h2>
        <p className="settings-note">
          Suka mainnya atau punya saran? Bisa dukung lewat Trakteer.
          Tulis pesan di kolom Trakteer (saran & feedback boleh).
        </p>
        <a
          href={TRAKTEER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-trakteer"
        >
          ☕ Buka Trakteer
        </a>
      </section>

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}

