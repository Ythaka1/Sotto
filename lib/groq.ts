import type { Verdict } from '@/lib/severity';

/*
 * The one model call. Tier 2 of respond().
 *
 * One JSON mode call per guest, at the end of the session, which is what keeps
 * this inside the free tier.
 *
 * Nothing here ever throws to the caller. Unreachable, slow, rate limited, and
 * malformed all resolve to null, and the caller falls through to the heuristic.
 * The guest never learns that any of it happened.
 */

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/* Deliberately explicit about what not to do. A model that apologises on the
   property's behalf or recommends action produces an email a GM will resent and
   then ignore, and the copy rules are part of the product, not decoration. */
const SYSTEM = `You classify a hotel guest's private checkout feedback for the general manager.
Return only JSON. No preamble, no markdown fences.

{
  "severity": "serious" | "minor",
  "theme": "short lowercase noun phrase, at most four words",
  "summary": "one plain sentence stating what the guest said, in the third person",
  "recoverable": true | false
}

serious means the guest is likely to write a negative public review, or was
treated badly, or something was broken, dirty, or unsafe.
minor means a small preference or an ordinary imperfection.
recoverable means a duty manager standing in front of this guest in the next
few minutes could still meaningfully address it.

Do not apologise. Do not editorialise. Do not recommend action.
Do not use em dashes or hyphens as punctuation.`;

/**
 * Validates the parsed shape before anyone trusts it.
 *
 * A model returning severity "moderate", or a theme as an array, or recoverable
 * as the string "true", must not reach the database. Any missing or wrong typed
 * field means the whole verdict is discarded rather than patched, because a
 * half trusted classification is worse than an honest heuristic one.
 */
export function validateVerdict(raw: unknown): Verdict | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const v = raw as Record<string, unknown>;

  if (v.severity !== 'serious' && v.severity !== 'minor') return null;
  if (typeof v.theme !== 'string' || v.theme.trim() === '') return null;
  if (typeof v.summary !== 'string' || v.summary.trim() === '') return null;
  if (typeof v.recoverable !== 'boolean') return null;

  /* The copy rules bind the model too. Rather than reject an otherwise good
     verdict over punctuation, normalise the two characters that are banned. */
  const clean = (s: string) => s.replace(/\s*[—–]\s*/g, ', ').replace(/\s+-\s+/g, ', ').trim();

  return {
    severity: v.severity,
    theme: clean(v.theme).toLowerCase().split(/\s+/).slice(0, 4).join(' '),
    summary: clean(v.summary),
    recoverable: v.recoverable,
  };
}

export async function classify(
  answer: string,
  followUpAnswer: string,
  signal?: AbortSignal,
): Promise<Verdict | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const guestText = [answer, followUpAnswer].filter(Boolean).join('\n\nThen, asked when:\n');

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: guestText },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;

    return validateVerdict(JSON.parse(content));
  } catch {
    /* Network failure, abort, non JSON body, and anything else land here
       together. The caller falls through to the heuristic. */
    return null;
  }
}
