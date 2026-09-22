/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect } from 'react';
import {
  loadProgress,
  updateProgress,
  exportProgress,
  importProgress,
} from '../lib/storage';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [soundMuted, setSoundMuted] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setSoundMuted(p.soundMuted);
  }, []);

  const handleMuteToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    updateProgress({ soundMuted: next });
    setMessage(next ? 'Suara dimatikan' : 'Suara diaktifkan');
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

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Kembali
        </button>
        <h1>Pengaturan</h1>
      </header>

      <section className="settings-section">
        <h2>Suara</h2>
        <button
          type="button"
          className={`settings-toggle ${soundMuted ? '' : 'active'}`}
          onClick={handleMuteToggle}
        >
          {soundMuted ? '🔇 Suara mati' : '🔊 Suara nyala'}
        </button>
        <p className="settings-note">
          Mematikan SFX dan musik latar. Pengaturan tersimpan di HP ini.
        </p>
      </section>

      <section className="settings-section">
        <h2>Pindah Progress antar HP</h2>
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

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}
