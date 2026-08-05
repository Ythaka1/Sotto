/*
 * The room number, from the folio QR.
 *
 * The QR printed on the folio is per room, not per property, and encodes
 * /f/the-aubrey?r=14. The room is read once on arrival, carried through the
 * session, and written to responses.room.
 *
 * It is never shown to the guest and never asked for. The folio already knows
 * the room, so asking would be the interface explaining itself.
 *
 * Without this the recovery offer is not actionable: telling the duty manager
 * that a guest somewhere in the building would like to be found before they
 * leave is a riddle, not an intercept.
 *
 * See docs/spec.md, "The room parameter".
 */

/** Up to 8 characters, so 14, 2B and Suite-3 all work. */
const ROOM_PATTERN = /^[A-Za-z0-9-]{1,8}$/;

/**
 * Reads the room from a raw query value.
 *
 * Absent or unparseable is not an error and never blocks the flow. Anything
 * that does not match is treated as absent rather than stored dirty, so a
 * mistyped or tampered QR loses the room instead of poisoning the manager's
 * inbox with junk.
 */
export function parseRoom(raw: string | string[] | undefined | null): string | null {
  // Next gives an array when the param is repeated. Take the first and ignore
  // the rest rather than guessing which one the folio meant.
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!ROOM_PATTERN.test(trimmed)) return null;

  return trimmed;
}

/**
 * The subject line for the manager email.
 *
 * When the room is known it is named. When it is not, the clause is omitted
 * entirely rather than asserting an absence: a subject reading "room not given"
 * on every email is noise that trains the manager to skim, and it makes the
 * common case look like a fault.
 */
export function emailSubject(propertyName: string, theme: string, room: string | null): string {
  return room ? `${propertyName}, room ${room}: ${theme}` : `${propertyName}: ${theme}`;
}
