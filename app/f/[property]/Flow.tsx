'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Arrival } from '@/components/screens/Arrival';
import { useTiming, EASE_STANDARD, DUR } from '@/lib/motion';
import type { Property } from '@/lib/seed/aubrey';

/*
 * The client orchestrator.
 *
 * Screens 1 through 4 land at step 5 and beyond. Screen 0 and the nothing to
 * report path are wired now, because the exit is what stops a guest with a good
 * stay from being trapped, and it is cheaper to build it in than to add it
 * later.
 */

type Screen = 'arrival' | 'question' | 'close';

export function Flow({ property, room }: { property: Property; room: string | null }) {
  const t = useTiming();
  const [screen, setScreen] = useState<Screen>('arrival');

  /* Recorded rather than treated as an abandon. severity 'none', answer null,
     no model call. Wired to /api/commit at step 8. */
  const nothingToReport = () => {
    void room;
    setScreen('close');
  };

  const transition = {
    duration: t.d(DUR.standard),
    ease: EASE_STANDARD,
  };

  return (
    <main className="mx-auto max-w-[420px]">
      <AnimatePresence mode="wait">
        {screen === 'arrival' && (
          <motion.div
            key="arrival"
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: t.d(DUR.exit), ease: EASE_STANDARD }}
          >
            <Arrival
              property={property}
              onStart={() => setScreen('question')}
              onNothingToReport={nothingToReport}
            />
          </motion.div>
        )}

        {screen === 'close' && (
          <motion.div
            key="close"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="flex min-h-dvh items-center justify-center px-6"
          >
            <p className="t-question">Safe travels.</p>
          </motion.div>
        )}

        {screen === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="flex min-h-dvh items-center justify-center px-6"
          >
            <p className="t-body text-muted">Screen 1 lands at step 5.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
