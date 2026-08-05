/*
 * The four chips under the question on screen 1.
 *
 * They are starters, not answers. A guest with a taxi waiting will not type
 * from nothing, but they will finish a sentence someone else began.
 *
 * Each starter is deliberately incomplete and deliberately neutral. It commits
 * the guest to a subject without putting a complaint in their mouth: "The room
 * was " can be finished as "too warm" or "lovely", and the product has no
 * opinion about which.
 *
 * The trailing space matters. The cursor lands after it, so the guest types the
 * next word rather than reaching for the spacebar first.
 */

export type Chip = { label: string; starter: string };

export const CHIPS: Chip[] = [
  { label: 'room comfort', starter: 'The room was ' },
  { label: 'check in', starter: 'Check in was ' },
  { label: 'breakfast', starter: 'Breakfast was ' },
  { label: 'noise', starter: 'It was noisy ' },
];
