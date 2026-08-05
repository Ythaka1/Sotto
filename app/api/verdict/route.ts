import { NextResponse } from 'next/server';
import { classify } from '@/lib/groq';
import { heuristicVerdict } from '@/lib/severity';

/*
 * Classify only. Writes nothing, sends nothing.
 *
 * This is what makes Undo an honest promise: at the moment the guest presses
 * Send privately, the only thing that happens is a classification, and nothing
 * about their stay exists anywhere yet.
 *
 * Always answers 200. The client has no error path to take, and a failure here
 * is indistinguishable from a slow model as far as the guest is concerned.
 */

export const runtime = 'nodejs';

/* The seal's recovery offer reads this at 1700ms. Past that the answer is no
   longer useful, so stop waiting rather than hold the request open. */
const BUDGET_MS = 2500;

export async function POST(request: Request) {
  let answer = '';
  let followUpAnswer = '';

  try {
    const body = await request.json();
    answer = typeof body?.answer === 'string' ? body.answer : '';
    followUpAnswer = typeof body?.followUpAnswer === 'string' ? body.followUpAnswer : '';
  } catch {
    /* A malformed body still gets a usable verdict rather than a 400. */
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BUDGET_MS);

  try {
    const fromModel = await classify(answer, followUpAnswer, controller.signal);
    if (fromModel) {
      return NextResponse.json({ verdict: fromModel, source: 'model' });
    }
  } finally {
    clearTimeout(timer);
  }

  /* Unreachable, slow, rate limited, or a shape we do not trust all land here.
     verdict_source records which, so the fallback's accuracy stays measurable
     rather than assumed. */
  return NextResponse.json({
    verdict: heuristicVerdict(answer, followUpAnswer),
    source: 'fallback',
  });
}
