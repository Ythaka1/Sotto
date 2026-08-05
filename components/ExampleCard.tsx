'use client';

import { motion } from 'framer-motion';
import { useTiming, DUR, STAGGER, EASE_SPRING } from '@/lib/motion';

/*
 * The three cards that fly in on arrival.
 *
 * They enter already rotated and already moving, from above, and settle into a
 * loose overlapping stack. They never enter flat and they never land together.
 *
 * Each one is on plane 3 while airborne and drops to plane 1 as it lands. Plane
 * 3 is a transient: nothing is still on it after the entry finishes.
 *
 * See docs/spec.md, motion table rows 0.1 to 0.4.
 */

export type Example = { line: string; room: string };

/* Entry and settle angles per card, back of the stack first. Every entry angle
   is between 2 and 14 degrees and every settle angle is smaller.

   The x offsets do real work. The cards overlap vertically, so without lateral
   separation each card's room label disappears under the next one and the stack
   reads as one torn sheet rather than three notes. */
const CHOREOGRAPHY = [
  { enter: -14, settle: -5, x: -30, y: 4 },
  { enter: 9, settle: 4, x: 34, y: -2 },
  { enter: 6, settle: -2, x: -18, y: 10 },
];

export function ExampleCard({
  example,
  index,
  onLanded,
}: {
  example: Example;
  index: number;
  onLanded?: () => void;
}) {
  const t = useTiming();
  const c = CHOREOGRAPHY[index] ?? CHOREOGRAPHY[0];
  const delay = index * STAGGER;

  return (
    <motion.div
      initial={{
        y: -140,
        rotate: c.enter,
        scale: 0.92,
        opacity: 0,
        boxShadow: 'var(--shadow-fly)',
      }}
      animate={{
        y: c.y,
        rotate: c.settle,
        scale: 1,
        opacity: 1,
        boxShadow: 'var(--shadow-rest)',
      }}
      transition={{
        default: {
          duration: t.d(0.56),
          delay: t.delay(delay),
          ease: EASE_SPRING,
        },
        /* Opacity resolves over the first 160ms rather than the whole flight,
           so the card is solid for almost all of its travel. A card fading in
           while it moves reads as a ghost. */
        opacity: {
          duration: t.d(0.16),
          delay: t.delay(delay),
          ease: 'linear',
        },
        /* The shadow crossfades to rest as the card lands, not while it flies. */
        boxShadow: {
          duration: t.d(DUR.standard),
          delay: t.delay(delay + 0.4),
          ease: 'linear',
        },
      }}
      onAnimationComplete={onLanded}
      style={{
        background: 'var(--plane)',
        borderRadius: 'var(--radius-small)',
        marginLeft: c.x,
      }}
      className="w-[248px] px-5 py-4"
    >
      {/* Label above the line, so the vertical overlap eats whitespace at the
          card's foot rather than the attribution. */}
      <p className="t-label mb-2">{example.room}</p>
      <p className="t-example">{example.line}</p>
    </motion.div>
  );
}
