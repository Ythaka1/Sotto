'use client';

import { motion } from 'framer-motion';
import { useTiming, DUR, EASE_SPRING } from '@/lib/motion';

/*
 * The closing beat, isolated behind one prop.
 *
 * Later the last 400ms will hand off to a pre rendered image sequence of a brass
 * folio clip closing over the note: photoreal light and material at the cost of
 * one image decode, which is how the reference video gets its depth.
 *
 * That swap must not require touching the seal's keyframes, so the beat lives
 * here rather than welded into the parent. The parent positions this and knows
 * nothing about how it closes.
 *
 * No WebGL on the guest path, ever.
 */

export type ClosureKind = 'css' | 'sequence';

export function Closure({
  kind = 'css',
  active,
}: {
  kind?: ClosureKind;
  /** True once the note has landed and the pocket should react. */
  active: boolean;
}) {
  const t = useTiming();

  if (kind === 'sequence') {
    throw new Error(
      'Closure: the "sequence" branch is not implemented. It will play a pre rendered ' +
        'image sequence of the folio clip. Use closure="css" until those frames exist.',
    );
  }

  return (
    <motion.div
      data-testid="pocket-front"
      aria-hidden
      /* Row 3.4. The lip squashes on impact and springs back. Origin bottom, so
         it compresses into the pocket rather than sliding down it. */
      initial={{ scaleY: 1, y: 0 }}
      animate={active ? { scaleY: [1, 1.07, 1], y: [0, -4, 0] } : { scaleY: 1, y: 0 }}
      transition={{
        duration: t.d(0.62),
        ease: EASE_SPRING,
        times: [0, 0.4, 1],
      }}
      style={{
        transformOrigin: 'bottom center',
        background: 'var(--plane)',
        borderRadius: '22px',
        /* The lip casts upward. A downward shadow here gives you two flat
           rectangles instead of a pocket with something inside it. */
        boxShadow:
          '0 -12px 26px -14px rgba(28,22,18,.28), inset 0 1px 0 rgba(255,255,255,.9)',
      }}
      className="absolute right-0 bottom-0 left-0 h-[78px]"
    />
  );
}

/** Kept beside the component so the parent's timing table reads in one place. */
export const CLOSURE_START = 0.94;
export const CLOSURE_DURATION = DUR.standard * 0 + 0.62;
