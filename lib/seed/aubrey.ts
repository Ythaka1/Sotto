/*
 * The Aubrey. Fictional, and deliberately so. No real hotel name appears
 * anywhere in this product.
 */

export type Property = {
  slug: string;
  name: string;
  dutyManager: string;
  /*
   * Anonymised one line examples shown on arrival. These are illustrative seed
   * strings, not real guest data.
   *
   * They are doing teaching work, not decoration. A guest reads three specific,
   * small, unangry sentences and learns what kind of answer is wanted without
   * being told. Every one is concrete, none is a rating, and none is a
   * complaint with heat in it.
   */
  examples: { line: string; room: string }[];
};

export const AUBREY: Property = {
  slug: 'the-aubrey',
  name: 'The Aubrey',
  dutyManager: 'Daniel',
  examples: [
    { line: 'The shower took a while to warm up.', room: 'Room 12' },
    { line: 'Check in was quick but the lift was hard to find.', room: 'Room 4' },
    { line: 'Breakfast ran out of oat milk by nine.', room: 'Room 21' },
  ],
};

export const PROPERTIES: Record<string, Property> = {
  [AUBREY.slug]: AUBREY,
};
