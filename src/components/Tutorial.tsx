/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState } from 'react';
import { t } from '../lib/i18n';
import { finishIntroSlides } from '../lib/onboarding';

export interface TutorialProps {
  onClose: () => void;
  /** true = dibuka manual dari Pengaturan */
  fromSettings?: boolean;
  /** Journey pemula: setelah selesai masuk fase dojo diam */
  isOnboardingIntro?: boolean;
}

const STEPS = [
  {
    emoji: '🥋',
    titleKey: 'tut1Title' as const,
    bodyKey: 'tut1Body' as const,
  },
  {
    emoji: '📐',
    titleKey: 'tutQTitle' as const,
    bodyKey: 'tutQBody' as const,
  },
  {
    emoji: '➕',
    titleKey: 'tutSymTitle' as const,
    bodyKey: 'tutSymBody' as const,
  },
  {
    emoji: '✋',
    titleKey: 'tut2Title' as const,
    bodyKey: 'tut2Body' as const,
  },
  {
    emoji: '💣',
    titleKey: 'tut3Title' as const,
    bodyKey: 'tut3Body' as const,
  },
  {
    emoji: '🗺️',
    titleKey: 'tut4Title' as const,
    bodyKey: 'tut4Body' as const,
  },
];

export default function Tutorial({
  onClose,
  fromSettings,
  isOnboardingIntro,
}: TutorialProps) {
  const [step, setStep] = useState(0);
  const last = step >= STEPS.length - 1;
  const s = STEPS[step];

  const handleFinish = () => {
    if (isOnboardingIntro) finishIntroSlides();
    onClose();
  };

  return (
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="tutorial-card">
        <p className="tutorial-emoji" aria-hidden>
          {s.emoji}
        </p>
        <h2 id="tutorial-title" className="tutorial-title">
          {t(s.titleKey)}
        </h2>
        <p className="tutorial-body">{t(s.bodyKey)}</p>

        {step === 1 && (
          <div className="tutorial-demo-q" aria-hidden>
            <span className="tut-card">?</span>
            <span className="tut-op">+</span>
            <span className="tut-card">?</span>
            <span className="tut-eq">=</span>
            <span className="tut-card tut-target">12</span>
          </div>
        )}
        {step === 2 && (
          <div className="tutorial-demo-ops" aria-hidden>
            <span className="tut-op-chip add">+</span>
            <span className="tut-op-chip sub">−</span>
            <span className="tut-op-chip mul">×</span>
            <span className="tut-op-chip div">÷</span>
          </div>
        )}

        <div className="tutorial-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`tutorial-dot${i === step ? ' is-on' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          {step > 0 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep((n) => n - 1)}
            >
              {t('back')}
            </button>
          )}
          {!last ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep((n) => n + 1)}
            >
              {t('next')}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleFinish}>
              {isOnboardingIntro ? t('tutStartDojo') : t('tutFinish')}
            </button>
          )}
        </div>

        {(fromSettings || isOnboardingIntro) && !last && (
          <button type="button" className="tutorial-skip" onClick={handleFinish}>
            {t('tutSkip')}
          </button>
        )}
      </div>
    </div>
  );
}
