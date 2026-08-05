'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Closure } from '@/components/Closure';
import type { ClosureKind } from '@/components/Closure';
import { useTiming, DUR, EASE_SPRING, EASE_STANDARD } from '@/lib/motion';

/*
 * The seal. A post, not a fold.
 *
 * The guest's words are on a note. The note lifts off the surface, shrinks,
 * tilts, and drops into a pocket, landing behind the pocket's front lip so it is
 * genuinely inside something rather than sitting on top of it. The lip squashes
 * on impact and springs back. Only then does the mark press in.
 *
 * Nothing rotates on the X axis. There is no flap, no perspective, no crease.
 * An earlier draft folded a lid closed over the words, which is invisible on a
 * plane over a plane, and would still have been lifeless once made visible,
 * because a lid closing in place has no journey in it.
 *
 * The z order is the whole illusion. If the note lands in front of the lip it
 * reads as a card sitting on a rectangle and the moment dies. It is asserted in
 * test/seal.mjs rather than left to inspection.
 *
 * Total arc is about 2.2 seconds, which is long for UI and correct here.
 * Sealing something is supposed to take a moment, and that pause is the product
 * telling the guest their words went somewhere private without a sentence of
 * copy doing the work.
 *
 * See docs/spec.md, motion table screen 3.
 */

export function Seal({
  text,
  closure = 'css',
  onUndo,
  showUndo = true,
}: {
  text: string;
  closure?: ClosureKind;
  onUndo?: () => void;
  showUndo?: boolean;
}) {
  const t = useTiming();
  /* Drives the lip, which must react while the note is still travelling. */
  const [landing, setLanding] = useState(t.reduced);

  useEffect(() => {
    if (t.reduced) {
      setLanding(true);
      return;
    }
    const id = setTimeout(() => setLanding(true), 940);
    return () => clearTimeout(id);
  }, [t.reduced]);

  /* Row 3.3. Four stops. The shadow tightening at the last one is what sells the
     descent: a note dropping into a pocket loses its ambient shadow and keeps
     only a close contact one, because the light stops reaching under it. */
  const noteKeyframes = {
    y: [0, -16, -8, 132],
    scale: [1, 1.02, 0.72, 0.72],
    rotate: [0, 0, -4, -1],
    boxShadow: [
      'var(--shadow-rest)',
      'var(--shadow-fly)',
      'var(--shadow-fly)',
      '0 6px 12px -8px rgba(28,22,18,.34)',
    ],
  };

  const settled = {
    y: 132,
    scale: 0.72,
    rotate: -1,
    boxShadow: '0 6px 12px -8px rgba(28,22,18,.34)',
  };

  return (
    <div className="flex flex-col items-center">
      {/* 272px tall, relatively positioned, no perspective. */}
      <div className="relative h-[272px] w-full max-w-[320px]">
        {/* Plane 1, the pocket's full footprint. z 0. */}
        <div
          data-testid="pocket-back"
          aria-hidden
          className="absolute right-0 bottom-0 left-0 h-[186px]"
          style={{
            zIndex: 0,
            background: 'var(--plane)',
            borderRadius: '26px',
            boxShadow: 'var(--shadow-rest)',
          }}
        />

        {/* The note. z 1: above the pocket back, below the lip. */}
        <motion.div
          data-testid="note"
          initial={t.reduced ? settled : { y: 0, scale: 1, rotate: 0, boxShadow: 'var(--shadow-rest)' }}
          animate={t.reduced ? settled : noteKeyframes}
          transition={
            t.reduced
              ? { duration: 0.001 }
              : {
                  duration: t.d(DUR.seal),
                  delay: t.delay(0.12),
                  ease: EASE_SPRING,
                  times: [0, 0.2, 0.46, 1],
                }
          }
          style={{
            zIndex: 1,
            background: 'var(--plane)',
            borderRadius: 'var(--radius-small)',
            transformOrigin: 'center center',
          }}
          className="absolute top-0 right-3 left-3 px-5 py-4"
        >
          <motion.p
            className="t-example"
            data-testid="note-text"
            initial={{ opacity: t.reduced ? 0 : 1 }}
            animate={{ opacity: 0 }}
            transition={{
              duration: t.d(0.26),
              delay: t.delay(0.2),
              ease: EASE_STANDARD,
            }}
          >
            {text}
          </motion.p>
        </motion.div>

        {/* The lip. z 2, above the note. This is the illusion. */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <Closure kind={closure} active={landing} />
        </div>

        {/* The mark, pressed into the closed pocket. z 3. */}
        <motion.div
          data-testid="mark"
          aria-hidden
          className="absolute bottom-[26px] left-1/2 h-[26px] w-[26px]"
          style={{ zIndex: 3, marginLeft: -13 }}
          initial={t.reduced ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0.3, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            duration: t.d(0.52),
            delay: t.delay(1.12),
            ease: EASE_SPRING,
          }}
        >
          <span className="bg-seal block h-full w-full rounded-pill" />
          {/* Row 3.6. Dropped entirely under reduced motion rather than
              shortened: a ring that expands in 1ms is a flash, and a flash is
              worse than nothing. It is absent from the DOM, not merely
              instant. */}
          {!t.reduced && (
            <motion.span
              data-testid="ring"
              className="absolute inset-0 rounded-pill"
              style={{ border: '1.5px solid var(--seal)' }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: t.d(DUR.ring),
                delay: t.delay(1.22),
                ease: EASE_STANDARD,
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Row 3.7. The line and Undo arrive together. */}
      <motion.div
        data-testid="sealed-line"
        className="mt-9 flex w-full max-w-[320px] items-center justify-between"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: t.d(0.44),
          delay: t.delay(1.46),
          ease: EASE_STANDARD,
        }}
      >
        <p className="t-body">Sealed. Only the manager reads this.</p>
        {showUndo && (
          <button type="button" onClick={onUndo} className="t-undo shrink-0 px-3 py-2">
            Undo
          </button>
        )}
      </motion.div>
    </div>
  );
}
