'use client';

/*
 * The way out for a guest who has nothing to say.
 *
 * Screen 0 offering only Start, with screen 1's Continue disabled until there
 * is text, traps a guest who had a genuinely good stay. They leave, and the
 * product records nothing.
 *
 * This is recorded rather than treated as an abandon: severity 'none', answer
 * null, no model call. A guest who explicitly says nothing went wrong is real
 * signal, and it is not the same event as someone walking away.
 *
 * It is deliberately quiet. It sits under the primary action, in muted type, at
 * label size. It is a door, not an invitation.
 */

export function QuietExit({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      /* Tap target is padded to 44px even though the type is small. */
      className="t-body text-muted mx-auto block px-6 py-3 underline underline-offset-4"
    >
      {children}
    </button>
  );
}
