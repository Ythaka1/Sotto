'use client';

import { motion } from 'framer-motion';
import { QuestionCard } from '@/components/QuestionCard';
import { Chips } from '@/components/Chips';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuietExit } from '@/components/QuietExit';
import { useTiming, EASE_STANDARD, DUR } from '@/lib/motion';

/*
 * Screen 1. The question.
 *
 * Continue is disabled until there is text, but it stays in the tab order and
 * points at a hidden line explaining why, so a keyboard or screen reader guest
 * is told the reason instead of finding a dead control.
 */

const HINT_ID = 'continue-hint';

export function Question({
  value,
  onChange,
  onTyped,
  chipsInert,
  onPickChip,
  onContinue,
  onNothingComesToMind,
  resumed,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Real keyboard editing. Separate from onChange because a chip fill also
      changes the value, and only one of the two should retire the chips. */
  onTyped: () => void;
  chipsInert: boolean;
  onPickChip: (starter: string) => void;
  onContinue: () => void;
  onNothingComesToMind: () => void;
  /** True when the guest came back to this screen and their text is waiting. */
  resumed: boolean;
}) {
  const t = useTiming();
  const empty = value.trim().length === 0;

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[76px] pb-8">
      <motion.h1
        className="t-question mb-6"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: t.d(DUR.standard), ease: EASE_STANDARD }}
      >
        Was there one small thing we could have done better?
      </motion.h1>

      <QuestionCard
        value={value}
        onChange={onChange}
        onTyped={onTyped}
        label="Was there one small thing we could have done better?"
        autoFocusAtEnd={resumed}
      />

      <div className="mt-5">
        <Chips onPick={onPickChip} inert={chipsInert} />
      </div>

      <div className="flex-1" />

      <PrimaryButton onClick={onContinue} disabled={empty} describedBy={HINT_ID}>
        Continue
      </PrimaryButton>

      {/* Announced, never shown. The button's own copy stays the promise of what
          happens, not an instruction about what is missing. */}
      <span id={HINT_ID} className="sr-only">
        Add a few words to continue.
      </span>

      <div className="mt-2">
        <QuietExit onClick={onNothingComesToMind}>Nothing comes to mind</QuietExit>
      </div>
    </div>
  );
}
