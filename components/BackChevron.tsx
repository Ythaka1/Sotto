'use client';

import { motion } from 'framer-motion';
import { useTiming, DUR, EASE_SPRING, EASE_STANDARD } from '@/lib/motion';

/*
 * Back, top left. A 38px circular plane floating on the ground with no header
 * bar behind it.
 *
 * The visible plane is 38px and the tap target is 44px, so the thumb of a guest
 * holding a bag in the other hand does not miss it.
 *
 * Present on screens 1 and 2 only. Motion rows T.3 and T.4.
 */

export function BackChevron({ onClick }: { onClick: () => void }) {
  const t = useTiming();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Back"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        /* Arriving, so spring. Leaving, so standard: things that go away do not
           get to overshoot. */
        scale: { duration: t.d(DUR.standard), ease: EASE_SPRING },
        opacity: { duration: t.d(DUR.standard), ease: EASE_STANDARD },
      }}
      /* 44px target, 38px plane. The extra 3px each side is padding, not fill. */
      className="absolute top-[17px] left-[17px] flex h-11 w-11 items-center justify-center"
    >
      <span
        className="flex h-[38px] w-[38px] items-center justify-center rounded-pill"
        style={{ background: 'var(--plane)', boxShadow: 'var(--shadow-rest)' }}
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
          <path
            d="M10.5 3.5L5.5 8.5L10.5 13.5"
            stroke="var(--ink)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </motion.button>
  );
}
