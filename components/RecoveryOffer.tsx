'use client';

import { motion } from 'framer-motion';
import { useTiming, EASE_SPRING } from '@/lib/motion';

/*
 * The recovery offer. Serious only.
 *
 * This is the commercial heart of the product. A complaint intercepted while the
 * guest is still in the lobby is a complaint that never reaches a review site.
 *
 * Both answers are recorded. "No thank you" is not a failure state and is never
 * treated as one, which is why the two buttons carry equal weight and neither is
 * styled as the lesser choice.
 */

export function RecoveryOffer({
  dutyManager,
  onAnswer,
}: {
  dutyManager: string;
  onAnswer: (wants: boolean) => void;
}) {
  const t = useTiming();

  return (
    <motion.div
      data-testid="recovery-offer"
      initial={{ y: 24, scale: 0.96, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ duration: t.d(0.46), ease: EASE_SPRING }}
      style={{
        background: 'var(--plane)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-lift)',
      }}
      className="mt-10 w-full max-w-[320px] p-6"
    >
      <p className="t-body mb-5">
        Would you like {dutyManager}, the duty manager, to find you before you leave?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="on-ink t-button flex-1 rounded-pill px-5 py-4"
          style={{ background: 'var(--ink)', color: 'var(--plane)' }}
        >
          Yes, please
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="t-button flex-1 rounded-pill px-5 py-4"
          style={{ background: 'var(--plane)', boxShadow: 'var(--shadow-rest)' }}
        >
          No thank you
        </button>
      </div>
    </motion.div>
  );
}
