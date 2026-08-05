'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Arrival } from '@/components/screens/Arrival';
import { Question } from '@/components/screens/Question';
import { FollowUp } from '@/components/screens/FollowUp';
import { Sealing } from '@/components/screens/Sealing';
import { BackChevron } from '@/components/BackChevron';
import { useTiming, EASE_STANDARD, DUR } from '@/lib/motion';
import { emptySession } from '@/lib/session';
import type { Session } from '@/lib/session';
import { followUpQuestion, detectSeverity } from '@/lib/severity';
import type { Verdict } from '@/lib/severity';
import { commit } from '@/lib/commit';
import type { Property } from '@/lib/seed/aubrey';

/*
 * The client orchestrator.
 *
 * One session object, one screen name, one direction. Every screen reads from
 * the session and writes back to it, so nothing a guest typed can be lost by
 * moving between screens.
 *
 * Direction exists so backward motion reads as backward. Going back runs the
 * same transition rows with y inverted, which is the difference between
 * navigating and teleporting.
 */

type ScreenName = 'arrival' | 'question' | 'followUp' | 'seal' | 'close';

const ORDER: ScreenName[] = ['arrival', 'question', 'followUp', 'seal', 'close'];

export function Flow({ property, room }: { property: Property; room: string | null }) {
  const t = useTiming();
  const [session, setSession] = useState<Session>(() => emptySession(room));
  const [screen, setScreen] = useState<ScreenName>('arrival');
  const [direction, setDirection] = useState<1 | -1>(1);
  /* True once the guest has typed since the last chip tap. Chips go inert after
     this, so a mistap can never destroy a sentence someone wrote. */
  const [hasTyped, setHasTyped] = useState(false);
  /* Which screens the guest has already been to, so returning restores the
     cursor rather than starting cold. */
  const [visited, setVisited] = useState<Set<ScreenName>>(new Set(['arrival']));

  const go = useCallback((next: ScreenName) => {
    setDirection(ORDER.indexOf(next) >= ORDER.indexOf(screen) ? 1 : -1);
    setVisited((v) => new Set(v).add(next));
    setScreen(next);
  }, [screen]);

  const patch = (p: Partial<Session>) => setSession((s) => ({ ...s, ...p }));

  /* The follow up wording is decided locally and synchronously. The model is
     one call at the end of the session, so it cannot be consulted here. */
  const openFollowUp = () => {
    const question = followUpQuestion(detectSeverity(session.answer));
    patch({ followUpQuestion: question });
    go('followUp');
  };

  /* A guest who explicitly says nothing went wrong is real signal, and is not
     the same event as an abandoned session. Recorded with a null answer and no
     model call, and no email fires for it. */
  const nothingToReport = () => {
    const verdict: Verdict = {
      severity: 'none',
      theme: 'nothing to report',
      summary: 'The guest reported nothing to raise at checkout.',
      recoverable: false,
    };
    patch({ answer: '', verdict });
    commit({
      propertySlug: property.slug,
      room: session.roomFromQuery,
      answer: null,
      followUpQuestion: null,
      followUpAnswer: null,
      verdict,
      verdictSource: 'fallback',
      recoveryRequested: null,
    });
    go('close');
  };

  const commitSession = (
    verdict: Verdict,
    verdictSource: 'model' | 'fallback',
    recoveryRequested: boolean | null,
  ) => {
    commit({
      propertySlug: property.slug,
      room: session.roomFromQuery,
      answer: session.answer,
      followUpQuestion: session.followUpQuestion,
      followUpAnswer: session.followUpAnswer || null,
      verdict,
      verdictSource,
      recoveryRequested,
    });
  };

  const backChevronVisible = screen === 'question' || screen === 'followUp';

  /* Rows T.1 and T.2, with y inverted when moving backward. */
  const enter = { opacity: 0, y: direction === 1 ? 12 : -12 };
  const exit = { opacity: 0, y: direction === 1 ? -8 : 8 };
  const transition = { duration: t.d(DUR.standard), ease: EASE_STANDARD };
  const exitTransition = { duration: t.d(DUR.exit), ease: EASE_STANDARD };

  const screens: Record<ScreenName, React.ReactNode> = {
    arrival: (
      <Arrival
        property={property}
        onStart={() => go('question')}
        onNothingToReport={nothingToReport}
      />
    ),
    question: (
      <Question
        value={session.answer}
        onChange={(answer) => patch({ answer })}
        onTyped={() => setHasTyped(true)}
        chipsInert={hasTyped}
        onPickChip={(starter) => {
          patch({ answer: starter });
          /* A chip fill is not typing, so the next chip may still replace it. */
          setHasTyped(false);
        }}
        onContinue={openFollowUp}
        onNothingComesToMind={nothingToReport}
        resumed={visited.has('question') && session.answer.length > 0 && direction === -1}
      />
    ),
    followUp: (
      <FollowUp
        question={session.followUpQuestion ?? followUpQuestion('minor')}
        value={session.followUpAnswer}
        onChange={(followUpAnswer) => patch({ followUpAnswer })}
        onSend={() => go('seal')}
        resumed={session.followUpAnswer.length > 0 && direction === -1}
      />
    ),
    seal: (
      <Sealing
        session={session}
        dutyManager={property.dutyManager}
        /* Undo returns the guest to their answer with the text intact. Nothing
           was written, so there is nothing to reverse on the server. */
        onUndo={() => go('question')}
        onCommit={commitSession}
        onDone={() => go('close')}
      />
    ),
    close: (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="t-question">Safe travels.</p>
      </div>
    ),
  };

  return (
    <main className="relative mx-auto max-w-[420px]">
      <AnimatePresence>
        {backChevronVisible && (
          <BackChevron
            key="back"
            onClick={() => go(screen === 'followUp' ? 'question' : 'arrival')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={enter}
          animate={{ opacity: 1, y: 0 }}
          exit={exit}
          transition={screen === 'arrival' ? exitTransition : transition}
        >
          {screens[screen]}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
