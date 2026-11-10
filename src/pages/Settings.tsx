/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect } from 'react';
import {
  loadProgress,
  updateProgress,
  exportProgress,
  importProgress,
  isDevUnlockCode,
  isDevLockCode,
  clearAllGameData,
} from '../lib/storage';
import { TRAKTEER_URL, KOFI_URL, buildInviteText } from '../lib/constants';
import { t, getLang, setLang, type Lang } from '../lib/i18n';

interface SettingsProps {
  onBack: () => void;
  onLangChange?: () => void;
  onShowTutorial?: () => void;
  offline?: boolean;
}

export default function Settings({
  onBack: _onBack,
  onLangChange,
  onShowTutorial,
  offline = false,
}: SettingsProps) {
  const [soundMuted, setSoundMuted] = useState(false);
  const [lang, setLangLocal] = useState<Lang>('id');
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState('');
  const [unlockPopup, setUnlockPopup] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  /** Section terbuka: privacy, sound, language, support default open */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    privacy: true,
    sound: true,
    language: true,
    support: true,
    tutorial: false,
    progress: false,
    import: false,
    invite: false,
    clear: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setMessage(t('clearDataWarn'));
      return;
    }
    // Pop-up kedua agar tidak terhapus karena tidak sengaja
    const ok = window.confirm(t('clearDataPopup'));
    if (!ok) {
      setClearConfirm(false);
      setMessage('');
      return;
    }
    clearAllGameData(true);
    setClearConfirm(false);
    setExportCode('');
    setImportCode('');
    setMessage(t('clearDataDone'));
    onLangChange?.();
    window.setTimeout(() => window.location.reload(), 400);
  };

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
    const suffix = t('waProgressSuffix').trim();
    const text = encodeURIComponent(
      suffix
        ? `${t('waProgressPrefix')}\n\n${exportCode}\n\n${suffix}`
        : `${t('waProgressPrefix')}\n\n${exportCode}`
    );
    if (offline) { setMessage(t('offlineNeedNet')); return; }
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      setMessage(t('msgNeedCode'));
      return;
    }
    const isUnlock = isDevUnlockCode(importCode);
    const isLock = isDevLockCode(importCode);
    // Cheat unlock/lock wajib online (penghalang kasual; string tetap di client)
    if ((isUnlock || isLock) && offline) {
      setMessage(t('msgCheatNeedOnline'));
      return;
    }
    const ok = importProgress(importCode);
    if (ok) {
      const msg = isUnlock
        ? t('msgDevUnlockOk')
        : isLock
          ? t('msgDevLockOk')
          : t('msgImportOk');
      setMessage(msg);
      if (isUnlock || isLock) {
        setUnlockPopup(msg);
      }
      setImportCode('');
    } else {
      setMessage(isUnlock || isLock ? t('msgCheatNeedOnline') : t('msgImportFail'));
    }
  };

  const handleShareInvite = async () => {
    if (offline) {
      setMessage(t('offlineNeedNet'));
      return;
    }
    const text = buildInviteText();
    // Web Share API (HP modern) — buka sheet WA / Telegram / dll
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Kungfu Math',
          text,
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
      {offline && (
        <p className="offline-settings-note" role="status">{t('offlineNeedNet')}</p>
      )}
      <header className="settings-header">
        <h1>{t('settingsTitle')}</h1>
      </header>

      {/* 1. Privasi — default terbuka */}
      <section className={`settings-section ${openSections.privacy ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('privacy')}
          aria-expanded={openSections.privacy}
        >
          <h2>{t('settingsPrivacy')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.privacy ? '▾' : '▸'}
          </span>
        </button>
        {openSections.privacy && (
          <div className="settings-section-body">
            <p className="settings-note">{t('settingsPrivacyNote')}</p>
          </div>
        )}
      </section>

      {/* 2. Suara — default terbuka */}
      <section className={`settings-section ${openSections.sound ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('sound')}
          aria-expanded={openSections.sound}
        >
          <h2>{t('settingsSound')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.sound ? '▾' : '▸'}
          </span>
        </button>
        {openSections.sound && (
          <div className="settings-section-body">
            <button
              type="button"
              className={`settings-toggle settings-toggle-half ${soundMuted ? '' : 'active'}`}
              onClick={handleMuteToggle}
            >
              {soundMuted ? t('soundOff') : t('soundOn')}
            </button>
            <p className="settings-note">{t('soundNote')}</p>
          </div>
        )}
      </section>

      {/* 3. Bahasa — default terbuka */}
      <section className={`settings-section ${openSections.language ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('language')}
          aria-expanded={openSections.language}
        >
          <h2>{t('settingsLanguage')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.language ? '▾' : '▸'}
          </span>
        </button>
        {openSections.language && (
          <div className="settings-section-body">
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
          </div>
        )}
      </section>

      {/* 4. Saran & Dukung — default terbuka */}
      <section className={`settings-section ${openSections.support ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('support')}
          aria-expanded={openSections.support}
        >
          <h2>{t('settingsSupport')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.support ? '▾' : '▸'}
          </span>
        </button>
        {openSections.support && (
          <div className="settings-section-body">
            <p className="settings-note">{t('settingsSupportNote')}</p>
            <div className="export-actions settings-support-actions">
              <a
                className="btn-trakteer settings-support-btn"
                href={TRAKTEER_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('btnTrakteer')}
              </a>
              <a
                className="btn-kofi settings-support-btn"
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('btnKofi')}
              </a>
            </div>
          </div>
        )}
      </section>

      {/* 5. Cara main — default collaps */}
      <section className={`settings-section ${openSections.tutorial ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('tutorial')}
          aria-expanded={openSections.tutorial}
        >
          <h2>{t('settingsTutorial')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.tutorial ? '▾' : '▸'}
          </span>
        </button>
        {openSections.tutorial && (
          <div className="settings-section-body">
            <p className="settings-note">{t('settingsTutorialNote')}</p>
            {onShowTutorial && (
              <button type="button" className="btn-secondary" onClick={onShowTutorial}>
                {t('btnShowTutorial')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 6. Pindah progress — default collaps */}
      <section className={`settings-section ${openSections.progress ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('progress')}
          aria-expanded={openSections.progress}
        >
          <h2>{t('settingsProgress')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.progress ? '▾' : '▸'}
          </span>
        </button>
        {openSections.progress && (
          <div className="settings-section-body">
            <p className="settings-note">{t('settingsProgressNote')}</p>
            <div className="export-actions">
              <button
                type="button"
                className={`btn-primary ${offline ? 'is-offline-locked' : ''}`}
                disabled={offline}
                onClick={handleExport}
              >
                {t('btnExport')}
              </button>
              {exportCode && (
                <>
                  <button type="button" className="btn-secondary" onClick={handleCopy}>
                    {copied ? t('btnCopied') : t('btnCopy')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleWhatsApp}
                  >
                    {t('btnWhatsApp')}
                  </button>
                </>
              )}
            </div>
            {exportCode && (
              <textarea
                className="export-code"
                readOnly
                value={exportCode}
                rows={4}
                onFocus={(e) => e.target.select()}
              />
            )}
          </div>
        )}
      </section>

      {/* 7. Masukkan kode — default collaps */}
      <section className={`settings-section ${openSections.import ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('import')}
          aria-expanded={openSections.import}
        >
          <h2>{t('settingsImport')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.import ? '▾' : '▸'}
          </span>
        </button>
        {openSections.import && (
          <div className="settings-section-body settings-import-body">
            <p className="settings-note">{t('settingsImportNote')}</p>
            <textarea
              className="export-code"
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              rows={3}
              placeholder="KM1...."
              aria-label={t('settingsImport')}
            />
            <button
              type="button"
              className={`btn-primary ${offline ? 'is-offline-locked' : ''}`}
              disabled={offline}
              onClick={handleImport}
            >
              {t('btnImport')}
            </button>
          </div>
        )}
      </section>

      {/* 8. Ajak coba — default collaps */}
      <section className={`settings-section ${openSections.invite ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('invite')}
          aria-expanded={openSections.invite}
        >
          <h2>{t('settingsInvite')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.invite ? '▾' : '▸'}
          </span>
        </button>
        {openSections.invite && (
          <div className="settings-section-body">
            <p className="settings-note">{t('settingsInviteNote')}</p>
            <div className="export-actions settings-share-actions">
              <button
                type="button"
                className={`btn-primary ${offline ? 'is-offline-locked' : ''}`}
                disabled={offline}
                onClick={handleShareInvite}
              >
                {t('btnShare')}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCopyInvite}>
                {inviteCopied ? t('btnCopied') : t('btnCopyInvite')}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 9. Hapus data — default collaps */}
      <section className={`settings-section ${openSections.clear ? 'is-open' : 'is-collapsed'}`}>
        <button
          type="button"
          className="settings-section-head"
          onClick={() => toggleSection('clear')}
          aria-expanded={openSections.clear}
        >
          <h2>{t('clearDataTitle')}</h2>
          <span className="settings-chevron" aria-hidden>
            {openSections.clear ? '▾' : '▸'}
          </span>
        </button>
        {openSections.clear && (
          <div className="settings-section-body">
            <p className="settings-note">{t('clearDataNote')}</p>
            {!clearConfirm && (
              <button type="button" className="btn-ghost" onClick={handleClearAll}>
                {t('clearDataBtn')}
              </button>
            )}
            {clearConfirm && (
              <div className="export-actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleClearAll}
                  style={{ background: '#c62828', borderColor: '#c62828' }}
                >
                  {t('clearDataConfirm')}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setClearConfirm(false);
                    setMessage('');
                  }}
                >
                  {t('btnCancel')}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {message && <p className="settings-message">{message}</p>}
      {unlockPopup && (
        <div className="unlock-popup-backdrop" role="alertdialog" aria-modal="true">
          <div className="unlock-popup-card">
            <p className="unlock-popup-text">{unlockPopup}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setUnlockPopup(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <p className="settings-note app-version-line">{t('appVersionLabel')}: 0.1.9</p>
    </div>
  );
}

