/*
 * The one table.
 *
 * Written through the REST endpoint with the service role key, from the server
 * route only. No Supabase key of any kind reaches the browser, which is asserted
 * in test/secrets.mjs against the built client bundle rather than assumed.
 *
 * No client library: one insert does not justify the dependency, and a plain
 * fetch makes it obvious that this runs server side.
 */

export type ResponseRow = {
  property_slug: string;
  room: string | null;
  answer: string | null;
  follow_up_question: string | null;
  follow_up_answer: string | null;
  severity: 'serious' | 'minor' | 'none';
  theme: string | null;
  summary: string | null;
  recoverable: boolean;
  recovery_requested: boolean | null;
  verdict_source: 'model' | 'fallback';
};

export async function insertResponse(row: ResponseRow): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  try {
    const res = await fetch(`${url}/rest/v1/responses`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}
