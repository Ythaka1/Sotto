/*
 * The local severity heuristic. Tier 3 of respond(), and tier 1's stand in.
 *
 * Two jobs:
 *
 *  1. Screen 2's wording branches on severity, and screen 2 happens before the
 *     end of the session, so it cannot wait for the model. This runs
 *     synchronously with no network call.
 *  2. When Groq is unreachable, times out, or returns a shape we do not trust,
 *     this produces the verdict instead, and the row records
 *     verdict_source: 'fallback' so the fallback's accuracy stays measurable
 *     rather than assumed.
 *
 * It is deliberately biased toward 'serious'. A minor gripe misread as serious
 * costs a manager thirty seconds of attention. A serious complaint misread as
 * minor costs a public review, which is the entire thing this product exists to
 * prevent. The asymmetry is the whole design.
 */

export type Severity = 'serious' | 'minor' | 'none';

export type Verdict = {
  severity: Severity;
  theme: string;
  summary: string;
  recoverable: boolean;
};

/* Something was broken, dirty, unsafe, or the guest was treated badly.
 *
 * Matched on word boundaries, never as substrings. Substring matching is a trap
 * here: 'ill' lives inside 'pillow', 'ant' inside 'pleasant', 'bug' inside
 * 'debug'. A guest asking for a firmer pillow would have been escalated to a
 * duty manager. */
const SERIOUS_MARKERS = [
  'broken', 'broke', 'not work', 'not working', 'didnt work', "didn't work",
  'no hot water', 'cold shower', 'freezing', 'filthy', 'dirty', 'stain',
  'stained', 'smelled', 'smelt', 'stank', 'stink',
  'mould', 'mouldy', 'mold', 'damp', 'bugs', 'insect', 'insects', 'cockroach',
  'ants', 'bedbug', 'bedbugs', 'hair in',
  'unsafe', 'unsanitary', 'blood', 'sick', 'ill',
  'rude', 'ignored', 'dismissive', 'shouted', 'argued', 'refused', 'unhelpful',
  'lied', 'overcharged', 'double charged', 'charged twice',
  'never came', 'never arrived', 'no one came', 'nobody came', 'never cleaned',
  'leak', 'leaking', 'flood', 'flooded', 'no heating', 'no aircon',
  'no air con', 'no power', 'no water',
  'awful', 'terrible', 'appalling', 'unacceptable', 'disgusting', 'worst',
  'furious', 'angry', 'complained',
];

/* Waiting is only serious past about half an hour. "waited five minutes" is a
   sentence about a well run desk. */
const LONG_WAIT = /\bwaited\b[^.!?]{0,24}\b(an hour|hours|\d{2,}\s*minutes)\b/;

/* Ordinary imperfections and preferences. Present to hold the line against the
   intensity rules below, not to downgrade anything on its own. */
const MINOR_MARKERS = [
  'slightly', 'a little', 'a bit', 'minor', 'small', 'tiny', 'nitpick',
  'preference', 'would have liked', 'would prefer', 'could be', 'maybe',
  'not a big deal', 'no big deal', 'otherwise',
];

/* Themes, checked in order. First match wins, so the more specific sit first.
   These match on a leading boundary only, so 'bed' still catches 'bedroom'. A
   wrong theme costs a slightly odd subject line, not a missed complaint. */
const THEMES: [string, string[]][] = [
  ['hot water', ['hot water', 'shower', 'cold water', 'warm up', 'lukewarm']],
  ['heating', ['heating', 'radiator', 'cold room', 'freezing room', 'too cold']],
  ['air conditioning', ['aircon', 'air con', 'air conditioning', 'too warm', 'too hot', 'stuffy']],
  ['noise', ['noise', 'noisy', 'loud', 'thin wall', 'street', 'traffic', 'music', 'bar below']],
  ['cleanliness', ['dirty', 'filthy', 'clean', 'stain', 'dust', 'smell', 'bin ']],
  ['breakfast', ['breakfast', 'coffee', 'oat milk', 'buffet', 'egg', 'toast']],
  ['check in', ['check in', 'checkin', 'reception', 'front desk', 'queue', 'lift', 'elevator']],
  ['bed comfort', ['bed', 'mattress', 'pillow', 'duvet', 'sheet']],
  ['bathroom', ['bathroom', 'toilet', 'sink', 'towel', 'drain']],
  ['wifi', ['wifi', 'wi fi', 'internet', 'signal']],
  ['billing', ['bill', 'charge', 'invoice', 'folio', 'refund', 'deposit']],
  ['staff manner', ['staff', 'rude', 'manager', 'waiter', 'porter', 'unhelpful']],
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole word match. 'ill' must not fire inside 'pillow'. */
function hasWord(text: string, marker: string): boolean {
  return new RegExp(`\\b${escape(marker)}\\b`).test(text);
}

/** Leading boundary only, so 'bed' catches 'bedroom' but not 'embedded'. */
function hasPrefix(text: string, marker: string): boolean {
  return new RegExp(`\\b${escape(marker)}`).test(text);
}

export function detectTheme(text: string): string {
  const t = normalise(text);
  for (const [theme, markers] of THEMES) {
    if (markers.some((m) => hasPrefix(t, m))) return theme;
  }
  return 'general';
}

export function detectSeverity(text: string): 'serious' | 'minor' {
  const t = normalise(text);

  if (SERIOUS_MARKERS.some((m) => hasWord(t, m))) return 'serious';
  if (LONG_WAIT.test(t)) return 'serious';

  /* Shouting is a signal on its own. A run of four or more capitals, or repeated
     exclamation marks, means the guest is not describing a preference. Checked
     against the raw text, since normalising loses the case. */
  if (/[A-Z]{4,}/.test(text) || /!{2,}/.test(text)) return 'serious';

  /* Repetition across days turns an imperfection into a pattern. */
  if (/\b((every|each) (night|morning|day)|both nights|all week|again and again|twice)\b/.test(t)) {
    return 'serious';
  }

  if (MINOR_MARKERS.some((m) => hasPrefix(t, m))) return 'minor';

  return 'minor';
}

/**
 * The heuristic verdict. Used for screen 2's wording, and as the fallback when
 * the model is unreachable or returns a shape we do not trust.
 *
 * `summary` states what the guest said in the third person and never editorialises.
 */
export function heuristicVerdict(answer: string, followUp?: string): Verdict {
  const combined = [answer, followUp].filter(Boolean).join(' ');
  const severity = detectSeverity(combined);
  const theme = detectTheme(combined);

  return {
    severity,
    theme,
    /* Deliberately mechanical. The fallback's job is to be accurate about the
       subject, not to write well. The guest's own words carry the email. */
    summary: `The guest raised ${theme} at checkout.`,
    /* A duty manager in the lobby can act on almost anything still happening in
       the building. Billing is the exception that most often outlives the stay. */
    recoverable: severity === 'serious' && theme !== 'billing',
  };
}

/** Screen 2's question. Branches on severity, and the branch must be invisible. */
export function followUpQuestion(severity: 'serious' | 'minor'): string {
  return severity === 'serious'
    ? 'That should not have happened. When was it?'
    : 'Anything else worth knowing?';
}
