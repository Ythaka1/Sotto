'use client';

import { useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';

/*
 * One source of truth for motion.
 *
 * Every animated component in the product reads its timing from here. There is
 * no component that animates without going through this file, which is what
 * makes prefers-reduced-motion a property of the system rather than a pass at
 * the end.
 *
 * See docs/spec.md section 4.
 */

export const EASE_STANDARD = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export const DUR = {
  standard: 0.22,
  spring: 0.42,
  /** The note's travel into the pocket. The longest single move in the product. */
  seal: 1.18,
  press: 0.18,
  exit: 0.16,
  ring: 0.9,
} as const;

export const STAGGER = 0.085;

/** Grouped elements land 85ms apart, never together. */
export function stagger(index: number, reduced: boolean): number {
  return reduced ? 0 : index * STAGGER;
}

export type Timing = {
  /** True when the guest has asked for less motion. */
  reduced: boolean;
  /** Collapses any duration to 1ms under reduced motion. */
  d: (seconds: number) => number;
  /** Collapses any delay to 0 under reduced motion. */
  delay: (seconds: number) => number;
  /** Standard easing, 220ms. Everything that is not arriving or pressed. */
  standard: (delaySeconds?: number) => Transition;
  /** Slight overshoot then settle. Anything that arrives or is pressed. */
  spring: (durationSeconds?: number, delaySeconds?: number) => Transition;
};

/*
 * Test hook. `?slow=8` stretches every duration and delay by 8, so a 900ms
 * choreography can be photographed at the moments the motion table names
 * instead of wherever the screenshot happened to land.
 *
 * It reads from the URL rather than an env flag so it works against a
 * production build, which is the only build worth photographing. Everything in
 * the product times through this file, so one multiplier here reaches all of
 * it and there is nothing to keep in sync.
 */
function speedFactor(): number {
  if (typeof window === 'undefined') return 1;
  const raw = new URLSearchParams(window.location.search).get('slow');
  const n = raw === null ? 1 : Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 40 ? n : 1;
}

export function useTiming(): Timing {
  const reduced = useReducedMotion() ?? false;
  const factor = speedFactor();

  const d = (seconds: number) => (reduced ? 0.001 : seconds * factor);
  const delay = (seconds: number) => (reduced ? 0 : seconds * factor);

  return {
    reduced,
    d,
    delay,
    standard: (delaySeconds = 0) => ({
      duration: d(DUR.standard),
      delay: delay(delaySeconds),
      ease: EASE_STANDARD,
    }),
    spring: (durationSeconds = DUR.spring, delaySeconds = 0) => ({
      duration: d(durationSeconds),
      delay: delay(delaySeconds),
      ease: EASE_SPRING,
    }),
  };
}
