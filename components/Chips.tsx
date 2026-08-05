'use client';

import { motion } from 'framer-motion';
import { CHIPS } from '@/lib/chips';
import { useTiming, DUR, STAGGER, EASE_SPRING } from '@/lib/motion';

/*
 * The four starters under the question.
 *
 * They fill the field and put the cursor at the end. They do not answer for the
 * guest.
 *
 * Once the guest has typed, the chips go inert: tapping one no longer replaces
 * what they wrote. Silently destroying a sentence someone typed with a taxi
 * outside is the single worst thing this screen could do, and it is exactly what
 * an always live chip would do on a mistap.
 *
 * Inert is shown, not hidden. A control that looks live and does nothing is
 * worse than one that looks spent, so they drop to 40 percent and report
 * aria-disabled.
 */

export function Chips({
  onPick,
  inert,
}: {
  onPick: (starter: string) => void;
  inert: boolean;
}) {
  const t = useTiming();

  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip, i) => (
        <motion.button
          key={chip.label}
          type="button"
          data-testid="chip"
          onClick={inert ? undefined : () => onPick(chip.starter)}
          aria-disabled={inert}
          whileTap={inert ? undefined : { scale: 0.96 }}
          initial={{ y: 16, scale: 0.94, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: inert ? 0.4 : 1 }}
          transition={{
            duration: t.d(DUR.spring),
            delay: t.delay(0.17 + i * STAGGER),
            ease: EASE_SPRING,
          }}
          style={{
            background: 'var(--plane)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-rest)',
            pointerEvents: inert ? 'none' : undefined,
          }}
          className="t-chip px-4 py-3"
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}
