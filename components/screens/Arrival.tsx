'use client';

import { motion } from 'framer-motion';
import { ExampleCard } from '@/components/ExampleCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuietExit } from '@/components/QuietExit';
import { useTiming, EASE_STANDARD } from '@/lib/motion';
import type { Property } from '@/lib/seed/aubrey';

/*
 * Screen 0. Arrival, straight after the scan.
 *
 * Three small cards fly in from above with tilt and spring, staggered, and
 * settle into a loose overlapping stack. They carry anonymised one line
 * examples from other rooms, which quietly teaches the guest what kind of
 * answer is wanted without ever instructing them.
 *
 * Then the heading, the privacy line and the button stagger in beneath.
 *
 * The text starts arriving at 520ms, while the last card is still settling, so
 * the screen reads as one gesture rather than two sequential events. Everything
 * is interactive by 910ms.
 *
 * See docs/spec.md, motion table rows 0.1 to 0.7.
 */

/* Text delays, in seconds. Spaced by the 85ms stagger. */
const HEADING = 0.52;
const PRIVACY = 0.605;
const BUTTON = 0.69;
const EXIT = 0.775;

export function Arrival({
  property,
  onStart,
  onNothingToReport,
}: {
  property: Property;
  onStart: () => void;
  onNothingToReport: () => void;
}) {
  const t = useTiming();

  const rise = (delay: number) => ({
    initial: { y: 14, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: {
      duration: t.d(0.22),
      delay: t.delay(delay),
      ease: EASE_STANDARD,
    },
  });

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-12 pb-8">
      {/* The stack.
          The overlap is deliberately small. A tilted card's low corner dips
          roughly 9px below its nominal edge at these angles, so anything deeper
          than the card's own bottom padding starts eating the line above. These
          cards are teaching the guest what an answer looks like, and a half
          hidden example teaches nothing. The loose stack reads from the tilt and
          the lateral offsets instead, which cost no legibility. */}
      <div className="flex flex-1 flex-col items-center justify-start pt-4">
        <div className="w-[248px]">
          {property.examples.map((example, i) => (
            <div key={example.room} style={{ marginTop: i === 0 ? 0 : -4 }}>
              <ExampleCard example={example} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[420px] pt-8">
        <motion.h1 className="t-question mb-3" {...rise(HEADING)}>
          Before you go, one quiet question.
        </motion.h1>

        <motion.p className="t-body text-muted mb-8" {...rise(PRIVACY)}>
          {/* The only spot of colour before the seal. The same green comes back
              as the mark at the moment this promise is kept. */}
          <span
            aria-hidden
            className="bg-seal mr-2 inline-block h-[6px] w-[6px] rounded-pill align-middle"
          />
          Thirty seconds. It goes straight to the general manager and is never published.
        </motion.p>

        <motion.div {...rise(BUTTON)}>
          <PrimaryButton onClick={onStart}>Start</PrimaryButton>
        </motion.div>

        <motion.div className="mt-2" {...rise(EXIT)}>
          <QuietExit onClick={onNothingToReport}>Nothing to report</QuietExit>
        </motion.div>
      </div>
    </div>
  );
}
