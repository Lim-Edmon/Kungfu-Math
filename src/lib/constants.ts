/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { t } from './i18n';

export const TRAKTEER_URL = 'https://trakteer.id/lim.edmon';
export const APP_URL = 'https://kungfu-math.vercel.app/';

export function buildInviteText(): string {
  return `${t('inviteText')}${APP_URL}`;
}
