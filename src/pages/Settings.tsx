import { useState, useEffect } from 'react';
import { loadProgress, updateProgress, exportProgress, importProgress } from '../lib/storage';

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
    setMessage('Kode progress siap disalin / dikirim via WhatsApp');
  };

  const handleCopy = async () => {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setMessage('Kode disalin! Tempel di WhatsApp atau HP lain.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage('Gagal menyalin. Pilih teks di bawah lalu salin manual.');
    }
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      setMessage('Tempel kode progress dulu');
      return;
    }
    const ok = importProgress(importCode);
    if (ok) {
      setMessage('Progress berhasil dimasukkan!');
      setImportCode('');
    } else {
      setMessage('Kode tidak valid. Coba salin ulang dari HP lain.');
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
          Efek suara akan ditambahkan di fase berikutnya. Pengaturan ini sudah
          disimpan.
        </p>
      </section>

      <section className="settings-section">
        <h2>Bagikan Progress (antar HP)</h2>
        <p className="settings-note">
          Tanpa login. Buat kode → kirim via WhatsApp → di HP lain tempel kode.
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
              rows={3}
              onFocus={(e) => e.target.select()}
            />
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? 'Tersalin ✓' : 'Salin Kode'}
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Masukkan Progress</h2>
        <textarea
          className="code-area"
          placeholder="Tempel kode dari HP lain di sini..."
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          rows={3}
        />
        <button type="button" className="btn-primary" onClick={handleImport}>
          Masukkan Kode
        </button>
      </section>

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}
