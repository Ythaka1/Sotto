'use client';

import { motion } from 'framer-motion';
import { useTiming, EASE_SPRING } from '@/lib/motion';

/*
 * The recovery offer. Serious only.
 *
 * This is the commercial heart of the product. A complaint intercepted while the
 * guest is still in the lobby is a complaint that never reaches a review site.
 *
 * Both answers are recorded, and "No thank you" is not a failure state. It is not
 * dimmed, not shrunk, and not pushed to the edge: it sits at the same size on the
 * same plane as the accept, so declining costs the guest nothing and looks like
 * it costs nothing.
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
        {/* whitespace-nowrap on both: "No thank you" wrapping to two lines beside
            a single line "Yes, please" makes declining look like the awkward
            option, which is exactly the thumb on the scale this must not have. */}
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="on-ink t-button flex-1 rounded-pill px-4 py-4 whitespace-nowrap"
          style={{ background: 'var(--ink)', color: 'var(--plane)' }}
        >
          Yes, please
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="t-button flex-1 rounded-pill px-4 py-4 whitespace-nowrap"
          style={{ background: 'var(--plane)', boxShadow: 'var(--shadow-rest)' }}
        >
          No thank you
        </button>
      </div>
    </motion.div>
  );
}
