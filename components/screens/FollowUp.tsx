'use client';

import { motion } from 'framer-motion';
import { QuestionCard } from '@/components/QuestionCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTiming, EASE_STANDARD, DUR } from '@/lib/motion';

/*
 * Screen 2. One follow up question, its wording branched on severity.
 *
 * The branch has to be invisible as a mechanism. The question arrives with the
 * ordinary screen transition and nothing else: no extra emphasis on the serious
 * wording, no pause before it. A guest who can feel the product deciding
 * something about them stops answering honestly.
 *
 * No chips here. The guest has already given us the thing that matters, and
 * Continue is live even when this is empty, because this question is optional.
 */

export function FollowUp({
  question,
  value,
  onChange,
  onSend,
  resumed,
}: {
  question: string;
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  resumed: boolean;
}) {
  const t = useTiming();

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[76px] pb-8">
      <motion.h1
        className="t-question mb-6"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: t.d(DUR.standard), ease: EASE_STANDARD }}
      >
        {question}
      </motion.h1>

      <QuestionCard
        value={value}
        onChange={onChange}
        label={question}
        autoFocusAtEnd={resumed}
      />

      <div className="flex-1" />

      {/* Says what happens. Not "Submit", and not "Finish". */}
      <PrimaryButton onClick={onSend}>Send privately</PrimaryButton>
    </div>
  );
}
