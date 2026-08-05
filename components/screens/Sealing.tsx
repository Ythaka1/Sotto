'use client';

import { useEffect, useRef, useState } from 'react';
import { Seal } from '@/components/Seal';
import { RecoveryOffer } from '@/components/RecoveryOffer';
import { useTiming } from '@/lib/motion';
import { heuristicVerdict } from '@/lib/severity';
import type { Verdict } from '@/lib/severity';
import type { Session } from '@/lib/session';

/*
 * Screen 3. The seal, and the undo window.
 *
 * Nothing is written when the guest presses Send privately. /api/verdict
 * classifies and returns; it writes nothing and sends nothing. That is what
 * makes Undo an honest promise rather than a button that races a database.
 *
 * The window is the 2.2 seconds of the seal plus 6 seconds of the sealed line
 * being on screen. Commit fires when it closes, or immediately if the guest
 * answers the recovery offer and moves on.
 *
 * There is no error state here. No toast, no retry, no spinner. Under every
 * failure the seal completes identically, because a guest told the intercept
 * failed will go and write the public review instead.
 */

const RECOVERY_AT = 1700;
const UNDO_WINDOW = 6000;

export function Sealing({
  session,
  dutyManager,
  onUndo,
  onCommit,
  onDone,
}: {
  session: Session;
  dutyManager: string;
  onUndo: () => void;
  onCommit: (verdict: Verdict, source: 'model' | 'fallback', recoveryRequested: boolean | null) => void;
  onDone: () => void;
}) {
  const t = useTiming();
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [source, setSource] = useState<'model' | 'fallback'>('fallback');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryRequested, setRecoveryRequested] = useState<boolean | null>(null);
  /* Guards every path out, so a guest who taps Undo just as the timer fires does
     not get both a commit and a discard. */
  const settled = useRef(false);

  /* The model call fires on mount, which is the moment of the press. It runs
     underneath the seal, which happens to be exactly long enough to cover it. */
  useEffect(() => {
    let alive = true;
    const fallback = heuristicVerdict(session.answer, session.followUpAnswer);

    (async () => {
      try {
        const res = await fetch('/api/verdict', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            answer: session.answer,
            followUpAnswer: session.followUpAnswer,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!alive) return;
        setVerdict(data.verdict as Verdict);
        setSource(data.source as 'model' | 'fallback');
      } catch {
        /* Unreachable, slow, or malformed all land here identically. The guest
           never learns that anything happened. */
        if (!alive) return;
        setVerdict(fallback);
        setSource('fallback');
      }
    })();

    return () => {
      alive = false;
    };
  }, [session.answer, session.followUpAnswer]);

  /* The offer reads whatever the verdict is by 1700ms, and falls back to the
     heuristic if the model has not answered by then. */
  useEffect(() => {
    const delay = t.reduced ? 0 : RECOVERY_AT;
    const id = setTimeout(() => {
      const v = verdict ?? heuristicVerdict(session.answer, session.followUpAnswer);
      if (v.severity === 'serious') setShowRecovery(true);
    }, delay);
    return () => clearTimeout(id);
    // Deliberately not keyed on verdict: this fires once, at 1700ms, with
    // whatever has arrived by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The undo window closes and commit fires. */
  useEffect(() => {
    const total = t.reduced ? 500 : 2200 + UNDO_WINDOW;
    const id = setTimeout(() => {
      if (settled.current) return;
      settled.current = true;
      const v = verdict ?? heuristicVerdict(session.answer, session.followUpAnswer);
      onCommit(v, verdict ? source : 'fallback', recoveryRequested);
      onDone();
    }, total);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict, source, recoveryRequested]);

  const answerRecovery = (wants: boolean) => {
    setRecoveryRequested(wants);
    if (settled.current) return;
    settled.current = true;
    /* Answering is navigating on, so commit immediately rather than making the
       guest stand there while a timer they cannot see runs down. */
    const v = verdict ?? heuristicVerdict(session.answer, session.followUpAnswer);
    onCommit(v, verdict ? source : 'fallback', wants);
    onDone();
  };

  const undo = () => {
    if (settled.current) return;
    settled.current = true;
    /* The verdict is discarded. Nothing was ever written, so there is nothing
       to undo on the server. */
    onUndo();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Seal text={session.answer} onUndo={undo} />
      {showRecovery && <RecoveryOffer dutyManager={dutyManager} onAnswer={answerRecovery} />}
    </div>
  );
}
