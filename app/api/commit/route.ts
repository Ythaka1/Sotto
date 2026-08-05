import { NextResponse } from 'next/server';
import { insertResponse } from '@/lib/supabase';
import { sendManagerEmail } from '@/lib/email';
import { PROPERTIES } from '@/lib/seed/aubrey';
import { parseRoom } from '@/lib/room';

/*
 * Write the row, send the email. Fires when the undo window closes.
 *
 * Arrives by sendBeacon, which cannot set a content type or read a response, so
 * the body is parsed as text rather than trusting the header, and the reply is
 * an empty 204 that nobody reads.
 *
 * Always succeeds from the caller's point of view. There is no error state in
 * the guest UI for this to report into.
 */

export const runtime = 'nodejs';

type Severity = 'serious' | 'minor' | 'none';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    /* Read as text: a beacon sends text/plain to avoid a CORS preflight. */
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const property = PROPERTIES[String(body.propertySlug ?? '')];
  if (!property) return new NextResponse(null, { status: 204 });

  const verdict = body.verdict as
    | { severity?: unknown; theme?: unknown; summary?: unknown; recoverable?: unknown }
    | undefined;

  const severity: Severity =
    verdict?.severity === 'serious' || verdict?.severity === 'minor' || verdict?.severity === 'none'
      ? verdict.severity
      : 'minor';

  const answer = typeof body.answer === 'string' && body.answer.trim() !== '' ? body.answer : null;
  const recoveryRequested =
    body.recoveryRequested === true ? true : body.recoveryRequested === false ? false : null;

  /* Re-parsed server side. A room arriving on this request is not trusted just
     because the client sent it. */
  const room = parseRoom(typeof body.room === 'string' ? body.room : null);

  await insertResponse({
    property_slug: property.slug,
    room,
    answer,
    follow_up_question: typeof body.followUpQuestion === 'string' ? body.followUpQuestion : null,
    follow_up_answer: typeof body.followUpAnswer === 'string' ? body.followUpAnswer : null,
    severity,
    theme: typeof verdict?.theme === 'string' ? verdict.theme : null,
    summary: typeof verdict?.summary === 'string' ? verdict.summary : null,
    recoverable: verdict?.recoverable === true,
    recovery_requested: recoveryRequested,
    verdict_source: body.verdictSource === 'model' ? 'model' : 'fallback',
  });

  /* A guest who had nothing to raise is worth a row and is not worth an email.
     Waking a manager to tell them nothing happened is how a product gets muted. */
  if (severity !== 'none') {
    await sendManagerEmail({
      propertyName: property.name,
      room,
      answer,
      followUpQuestion: typeof body.followUpQuestion === 'string' ? body.followUpQuestion : null,
      followUpAnswer: typeof body.followUpAnswer === 'string' ? body.followUpAnswer : null,
      verdict: {
        severity,
        theme: typeof verdict?.theme === 'string' ? verdict.theme : 'general',
        summary: typeof verdict?.summary === 'string' ? verdict.summary : '',
        recoverable: verdict?.recoverable === true,
      },
      recoveryRequested,
      at: new Date(),
      timeZone: process.env.PROPERTY_TIME_ZONE,
    });
  }

  return new NextResponse(null, { status: 204 });
}
