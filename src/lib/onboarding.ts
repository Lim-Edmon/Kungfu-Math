/** Kungfu Math — onboarding journey helpers · narasi pendekar */

import type { ArenaStyle, PlayerProgress } from './types';
import { loadProgress, updateProgress } from './storage';

export type OnboardingPhase = PlayerProgress['onboardingPhase'];

/** Target skor latihan terbimbing */
export const ONBOARD_TARGET_STATIC = 200;
export const ONBOARD_TARGET_BOUNCE = 500;
export const ONBOARD_TARGET_PASS = 500;

export function getOnboardingPhase(p?: PlayerProgress): OnboardingPhase {
  const prog = p ?? loadProgress();
  return prog.onboardingPhase ?? 'done';
}

export function isOnboardingComplete(p?: PlayerProgress): boolean {
  return getOnboardingPhase(p) === 'done';
}

/** Pemain lama / sudah pernah clear journey: tidak kunci mode */
export function isOnboardingRelaxed(p?: PlayerProgress): boolean {
  const prog = p ?? loadProgress();
  if (prog.onboardingRelaxed) return true;
  if ((prog.onboardingPhase ?? 'done') === 'done') return true;
  return false;
}

/** Arena yang “disarankan” per fase (untuk kunci ketat pemula saja) */
export function allowedArenas(phase: OnboardingPhase): ArenaStyle[] {
  switch (phase) {
    case 'intro':
    case 'static':
      return ['static'];
    case 'bounce':
      return ['static', 'agility'];
    case 'pass':
      return ['static', 'agility', 'pass'];
    case 'done':
    default:
      return ['static', 'agility', 'pass'];
  }
}

export function isArenaAllowed(
  arena: ArenaStyle,
  phase?: OnboardingPhase,
  p?: PlayerProgress
): boolean {
  const prog = p ?? loadProgress();
  if (isOnboardingRelaxed(prog)) return true;
  return allowedArenas(phase ?? getOnboardingPhase(prog)).includes(arena);
}

export function isAdventureAllowed(
  phase?: OnboardingPhase,
  p?: PlayerProgress
): boolean {
  const prog = p ?? loadProgress();
  if (isOnboardingRelaxed(prog)) return true;
  return (phase ?? getOnboardingPhase(prog)) === 'done';
}

export function targetForPhase(phase: OnboardingPhase): number | null {
  if (phase === 'static') return ONBOARD_TARGET_STATIC;
  if (phase === 'bounce') return ONBOARD_TARGET_BOUNCE;
  if (phase === 'pass') return ONBOARD_TARGET_PASS;
  return null;
}

/** Arena yang disorot saat sesi terbimbing */
export function guidedArena(phase: OnboardingPhase): ArenaStyle | null {
  if (phase === 'static') return 'static';
  if (phase === 'bounce') return 'agility';
  if (phase === 'pass') return 'pass';
  return null;
}

/**
 * Setelah run latihan: maju fase HANYA ke depan (tidak mundur).
 * Progress parsial tetap — main lagi = lanjut fase tersimpan.
 */
export function advanceOnboardingAfterRun(opts: {
  score: number;
  arena: ArenaStyle;
  isAdventure: boolean;
}): OnboardingPhase {
  const p = loadProgress();
  const phase = p.onboardingPhase ?? 'done';
  if (phase === 'done' || phase === 'intro' || opts.isAdventure) return phase;

  const need = guidedArena(phase);
  const target = targetForPhase(phase);
  if (!need || target == null) return phase;
  if (opts.arena !== need) return phase;
  if (opts.score < target) return phase;

  const next: OnboardingPhase =
    phase === 'static' ? 'bounce' : phase === 'bounce' ? 'pass' : 'done';

  updateProgress({
    onboardingPhase: next,
    tutorialSeen: true,
    // Selesai penuh → longgarkan kunci selamanya
    ...(next === 'done' ? { onboardingRelaxed: true } : {}),
  });
  return next;
}

/**
 * Pemain lama minta ulang latihan dasar:
 * - Intro/slide + banner fase dari awal
 * - TIDAK kunci mode yang sudah dibuka
 * - TIDAK reset kota / skor / lencana
 */
export function restartOnboarding(): void {
  updateProgress({
    onboardingPhase: 'intro',
    tutorialSeen: false,
    onboardingRedoOfferSeen: true,
    onboardingRelaxed: true,
  });
}

export function declineOnboardingRedo(): void {
  updateProgress({ onboardingRedoOfferSeen: true });
}

/** Setelah tutup intro slides → fase dojo diam (fase tersimpan) */
export function finishIntroSlides(): void {
  const p = loadProgress();
  // Jangan mundurkan fase jika sudah lebih jauh (aman)
  const cur = p.onboardingPhase ?? 'intro';
  const order = ['intro', 'static', 'bounce', 'pass', 'done'];
  const curI = order.indexOf(cur);
  const staticI = order.indexOf('static');
  const nextPhase =
    curI >= 0 && curI > staticI ? cur : ('static' as OnboardingPhase);
  updateProgress({
    onboardingPhase: nextPhase === 'intro' ? 'static' : nextPhase,
    tutorialSeen: true,
  });
}
