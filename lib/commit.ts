/*
 * Getting the row and the email out, including when the guest is gone.
 *
 * A guest who seals and immediately locks their phone is the normal case, not
 * the edge case. The tab freezes or dies during the six second undo window more
 * often than it stays alive, so commit cannot be an ordinary fetch that the
 * browser is free to cancel on unload.
 *
 * sendBeacon is the only transport the browser promises to finish after the page
 * goes away. It cannot set headers or read a response, which is fine: commit has
 * nothing to tell the guest, and there is no error state in the guest UI for it
 * to report into.
 */

export type CommitPayload = {
  propertySlug: string;
  room: string | null;
  answer: string | null;
  followUpQuestion: string | null;
  followUpAnswer: string | null;
  verdict: {
    severity: 'serious' | 'minor' | 'none';
    theme: string;
    summary: string;
    recoverable: boolean;
  };
  verdictSource: 'model' | 'fallback';
  recoveryRequested: boolean | null;
};

/**
 * Fire and forget. Returns true when the browser accepted the beacon, false when
 * it fell through to fetch. Nothing downstream branches on it: the guest sees the
 * same thing either way.
 */
export function commit(payload: CommitPayload): boolean {
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    /* text/plain avoids a CORS preflight, which sendBeacon cannot survive. The
       route parses the body itself rather than trusting the content type. */
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon('/api/commit', blob)) return true;
  }

  /* keepalive lets this outlive the document too, though with a smaller size
     budget and less certainty than a beacon. */
  void fetch('/api/commit', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => {
    /* Swallowed on purpose. There is no error state in the guest UI, and a
       guest told the intercept failed will go and write the public review,
       which is the exact outcome this product exists to prevent. */
  });

  return false;
}
