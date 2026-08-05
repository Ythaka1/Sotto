import type { Verdict } from '@/lib/severity';

/*
 * The manager email.
 *
 * This is the artifact the buyer actually receives. The guest flow is what makes
 * it possible; this is the thing that decides whether a GM pays for this.
 *
 * It arrives on a phone, in a lobby, and is read standing up in about four
 * seconds. Everything below serves that and nothing else.
 *
 * What is deliberately absent: logo, images, tracking pixel, unsubscribe
 * furniture, colour beyond one line, and any suggestion about what to do. The
 * GM knows their hotel better than the model does, and a system that tells them
 * how to run it will be resented and then ignored.
 *
 * Tables, not flexbox, because it has to survive Outlook.
 */

export type EmailInput = {
  propertyName: string;
  room: string | null;
  answer: string | null;
  followUpQuestion: string | null;
  followUpAnswer: string | null;
  verdict: Verdict;
  recoveryRequested: boolean | null;
  /** Checkout time, as the manager's clock reads it. */
  at: Date;
  timeZone?: string;
};

const SEAL = '#2E4739';
const INK = '#17181A';
const MUTED = '#6E7075';

function hhmm(at: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(at);
}

/**
 * Two shapes only.
 *
 *   Guest waiting, room 14: shower ran cold
 *   The Aubrey, room 14: shower ran cold
 *
 * The first is used only when recovery was requested. The word "waiting" at the
 * front is the whole point: it is what gets a manager moving before the guest
 * reaches the door, and it only earns that position when someone is actually
 * standing there.
 *
 * When the room is unknown the clause is dropped rather than filled with
 * anything. A subject asserting an absence on every email trains the manager to
 * skim it.
 */
export function subject(input: Pick<EmailInput, 'propertyName' | 'room' | 'verdict' | 'recoveryRequested'>): string {
  const lead = input.recoveryRequested === true ? 'Guest waiting' : input.propertyName;
  const room = input.room ? `, room ${input.room}` : '';
  return `${lead}${room}: ${input.verdict.theme}`;
}

function recoveryLine(recoveryRequested: boolean | null): string | null {
  if (recoveryRequested === null) return null;
  return recoveryRequested
    ? 'Requested. The guest asked for a manager before leaving.'
    : 'Offered and declined.';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textBody(input: EmailInput): string {
  const lines: string[] = [];
  const where = [input.room ? `Room ${input.room}` : null, 'checkout', hhmm(input.at, input.timeZone)]
    .filter(Boolean)
    .join(', ');
  lines.push(where, '');

  lines.push('What the guest said');
  /* The guest's words appear verbatim. Never paraphrased, summarised, or
     cleaned up. The model's summary exists for the subject line, not for this. */
  lines.push(`"${input.answer ?? ''}"`, '');

  if (input.followUpAnswer) {
    lines.push(input.followUpQuestion ? `Then, ${input.followUpQuestion.replace(/\?$/, '').toLowerCase()}` : 'Then');
    lines.push(`"${input.followUpAnswer}"`, '');
  }

  lines.push(`Theme        ${input.verdict.theme}`);
  lines.push(`Severity     ${input.verdict.severity}`);
  const rec = recoveryLine(input.recoveryRequested);
  if (rec) lines.push(`Recovery     ${rec}`);

  return lines.join('\n');
}

export function htmlBody(input: EmailInput): string {
  const where = [input.room ? `Room ${input.room}` : null, 'checkout', hhmm(input.at, input.timeZone)]
    .filter(Boolean)
    .join(', ');
  const rec = recoveryLine(input.recoveryRequested);

  const row = (label: string, value: string) => `
        <tr>
          <td style="padding:2px 24px 2px 0;font:14px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:2px 0;font:14px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(value)}</td>
        </tr>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F0EE;">
  <tr>
    <td align="left" style="padding:28px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;">
        <tr>
          <td style="padding-bottom:20px;font:13px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(where)}</td>
        </tr>
        <tr>
          <td style="padding-bottom:6px;font:13px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">What the guest said</td>
        </tr>
        <tr>
          <td style="padding-bottom:22px;font:18px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">&ldquo;${escapeHtml(input.answer ?? '')}&rdquo;</td>
        </tr>
        ${
          input.followUpAnswer
            ? `<tr>
          <td style="padding-bottom:6px;font:13px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">${escapeHtml(
            input.followUpQuestion ? `Then, ${input.followUpQuestion.replace(/\?$/, '').toLowerCase()}` : 'Then',
          )}</td>
        </tr>
        <tr>
          <td style="padding-bottom:22px;font:18px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">&ldquo;${escapeHtml(input.followUpAnswer)}&rdquo;</td>
        </tr>`
            : ''
        }
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              ${row('Theme', input.verdict.theme)}
              ${row('Severity', input.verdict.severity)}
              ${rec ? row('Recovery', rec) : ''}
            </table>
          </td>
        </tr>
        ${
          input.recoveryRequested === true
            ? `<tr>
          <td style="padding-top:22px;font:15px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${SEAL};">The guest is waiting${
            input.room ? ` and is in room ${escapeHtml(input.room)}` : ''
          }.</td>
        </tr>`
            : ''
        }
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Sends via Resend. One email per guest, no digest and no batching: the value is
 * entirely in the latency.
 *
 * Returns false rather than throwing when it cannot send, including when the key
 * is absent. Nothing in the guest UI depends on the result.
 */
export async function sendManagerEmail(input: EmailInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.MANAGER_EMAIL;
  const from = process.env.SOTTO_FROM_EMAIL ?? 'Sotto <no-reply@sotto.invalid>';
  if (!key || !to) return false;

  /* Nothing in this product ever contacts the guest, so replies go nowhere. */
  const replyTo = process.env.SOTTO_REPLY_TO ?? 'no-reply@sotto.invalid';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject: subject(input),
        text: textBody(input),
        html: htmlBody(input),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
