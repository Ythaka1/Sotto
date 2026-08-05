import type { Verdict } from '@/lib/severity';

/*
 * Everything the flow knows about this guest, in one object.
 *
 * It lives for the length of one visit and is never persisted to the device.
 * Nothing here reaches the network until the guest presses Send privately, and
 * nothing is written until the undo window closes.
 */

export type Session = {
  /** From ?r= on the folio QR. Null when absent or unparseable. */
  roomFromQuery: string | null;
  answer: string;
  followUpQuestion: string | null;
  followUpAnswer: string;
  verdict: Verdict | null;
  /** Null when the offer was never shown, false when shown and declined. */
  recoveryRequested: boolean | null;
};

export function emptySession(roomFromQuery: string | null): Session {
  return {
    roomFromQuery,
    answer: '',
    followUpQuestion: null,
    followUpAnswer: '',
    verdict: null,
    recoveryRequested: null,
  };
}
