/** Kungfu Math — banner status offline */

import { t } from '../lib/i18n';

interface Props {
  online: boolean;
}

export default function OfflineBanner({ online }: Props) {
  if (online) return null;
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="offline-banner-inner">
        <span className="offline-banner-icon" aria-hidden>
          📡
        </span>
        <div className="offline-banner-text">
          <strong className="offline-banner-title">{t('offlineTitle')}</strong>
          <span className="offline-banner-body">{t('offlineBody')}</span>
        </div>
      </div>
    </div>
  );
}
