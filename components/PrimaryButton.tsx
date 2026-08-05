'use client';

import { motion } from 'framer-motion';
import { useTiming, DUR, EASE_SPRING } from '@/lib/motion';

/*
 * The primary action. Filled --ink, not --plane: the only raised surface in the
 * product that is an action rather than a container.
 *
 * It carries the plane 1 shadow pair and does not change plane on press. It
 * only scales.
 *
 * Buttons say what happens. This one never says "Submit".
 */

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  describedBy,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  /** Points at the hidden line explaining why the button is not yet live. */
  describedBy?: string;
}) {
  const t = useTiming();

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      /* Kept in the tab order and announced as disabled rather than removed, so
         a keyboard or screen reader guest is told why instead of finding a dead
         control. */
      aria-disabled={disabled}
      aria-describedby={disabled ? describedBy : undefined}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      animate={{ opacity: disabled ? 0.4 : 1 }}
      transition={{
        scale: { duration: t.d(DUR.press), ease: EASE_SPRING },
        opacity: t.standard(),
      }}
      style={{
        background: 'var(--ink)',
        color: 'var(--plane)',
        borderRadius: 'var(--radius-pill)',
        boxShadow: 'var(--shadow-rest)',
        pointerEvents: disabled ? 'none' : undefined,
      }}
      className="on-ink t-button w-full px-6 py-[18px]"
    >
      {children}
    </motion.button>
  );
}
