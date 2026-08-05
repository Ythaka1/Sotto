'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTiming, DUR, EASE_SPRING, EASE_STANDARD } from '@/lib/motion';

/*
 * The textarea in a raised card that lifts its shadow on focus.
 *
 * There is no placeholder. A placeholder here would be the interface talking
 * over the guest at the one moment it should be listening.
 *
 * Two nested motion elements on purpose. The outer one owns the entry (row 1.2,
 * a tilted spring) and the inner one owns the focus lift (rows 1.4 and 1.5).
 * Putting both on one element would have them fighting over `y`, and the entry
 * would snap whenever the guest focused the field.
 */

export function QuestionCard({
  value,
  onChange,
  onTyped,
  label,
  describedBy,
  autoFocusAtEnd = false,
  entryDelay = 0.085,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Fired only for real keyboard editing, never for a chip filling the field. */
  onTyped?: () => void;
  label: string;
  describedBy?: string;
  autoFocusAtEnd?: boolean;
  entryDelay?: number;
}) {
  const t = useTiming();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  /* Arriving with text already in the field puts the cursor at the end of it. A
     guest who taps back to re-read the question and finds their caret at
     position zero has to hunt for the end of their own sentence. */
  useEffect(() => {
    if (!autoFocusAtEnd) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, [autoFocusAtEnd]);

  return (
    <motion.div
      initial={{ y: 20, rotate: 2, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      transition={{
        duration: t.d(DUR.spring),
        delay: t.delay(entryDelay),
        ease: EASE_SPRING,
      }}
    >
      <motion.div
        data-testid="question-card"
        animate={{
          boxShadow: focused ? 'var(--shadow-lift)' : 'var(--shadow-rest)',
          y: focused ? -2 : 0,
        }}
        transition={{ duration: t.d(DUR.standard), ease: EASE_STANDARD }}
        style={{
          background: 'var(--plane)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-rest)',
        }}
        className="p-2"
      >
        <textarea
          ref={ref}
          rows={4}
          value={value}
          aria-label={label}
          aria-describedby={describedBy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            onChange(e.target.value);
            onTyped?.();
          }}
          /* 16px exactly, never smaller at any breakpoint. Below that iOS zooms
             the viewport on focus and the guest fights the page from then on. */
          style={{ fontSize: 16 }}
          className="t-body w-full resize-none rounded-[22px] bg-transparent p-4 outline-none"
        />
      </motion.div>
    </motion.div>
  );
}
