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
    setMessage(next === 'en' ? t('msgLangEn') : t('msgLangId'));
  };

  const handleExport = () => {
    const code = exportProgress();
    setExportCode(code);
    setMessage(t('msgExportReady'));
  };

  const handleCopy = async () => {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setMessage(t('msgCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(t('msgCopyFail'));
    }
  };

  const handleWhatsApp = () => {
    if (!exportCode) {
      handleExport();
      return;
    }
    const text = encodeURIComponent(
      `${t('waProgressPrefix')}

${exportCode}

${t('waProgressSuffix')}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      setMessage(t('msgNeedCode'));
      return;
    }
    const ok = importProgress(importCode);
    if (ok) {
      setMessage(t('msgImportOk'));
      setImportCode('');
    } else {
      setMessage(t('msgImportFail'));
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
        setMessage(t('msgShareOk'));
        return;
      } catch (err) {
        // User batal share → jangan error keras; fallback di bawah
        if (err instanceof DOMException && err.name === 'AbortError') {
          setMessage(t('msgShareCancel'));
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
    setMessage(t('msgShareWa'));
  };

  const handleCopyInvite = async () => {
    const text = buildInviteText();
    try {
      await navigator.clipboard.writeText(text);
      setInviteCopied(true);
      setMessage(t('msgInviteCopied'));
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setMessage(t('msgCopyFail'));
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
              </section>

      <section className="settings-section">
        <h2>{t('settingsProgress')}</h2>
        <p className="settings-note">{t('settingsProgressNote')}</p>
        <button type="button" className="btn-primary" onClick={handleExport}>
          {t('btnExport')}
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
                {copied ? t('btnCopied') : t('btnCopy')}
              </button>
              <button type="button" className="btn-primary" onClick={handleWhatsApp}>
                {t('btnWhatsApp')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>{t('settingsImport')}</h2>
        <p className="settings-note">{t('settingsImportNote')}</p>
        <textarea
          className="code-area"
          placeholder="KM1.eyJ..."
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          rows={4}
        />
        <button type="button" className="btn-primary" onClick={handleImport}>
          {t('btnImport')}
        </button>
      </section>

      <section className="settings-section">
        <h2>{t('settingsInvite')}</h2>
        <p className="settings-note">{t('settingsInviteNote')}</p>
        <div className="export-actions settings-share-actions">
          <button type="button" className="btn-primary" onClick={handleShareInvite}>
            {t('btnShare')}
          </button>
          <button type="button" className="btn-secondary" onClick={handleCopyInvite}>
            {inviteCopied ? t('btnCopied') : t('btnCopyInvite')}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settingsPrivacy')}</h2>
        <p className="settings-note">{t('settingsPrivacyNote')}</p>
      </section>

      <section className="settings-section">
        <h2>{t('settingsSupport')}</h2>
        <p className="settings-note">{t('settingsSupportNote')}</p>
        <a
          href={TRAKTEER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-trakteer"
        >
          {t('btnTrakteer')}
        </a>
      </section>

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}

