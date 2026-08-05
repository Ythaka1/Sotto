# Sotto

A pre review intercept for boutique hotels. A guest scans a QR code on their folio
at checkout, answers one or two quiet questions, and their answer is sealed and
routed privately to the general manager before it can become a public review.

The demo property, **The Aubrey**, is fictional.

The full contract is `docs/spec.md`. Read that first.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000/f/the-aubrey?r=14
```

Useful routes:

| Route | What it is |
|---|---|
| `/f/the-aubrey?r=14` | The guest flow. `r` is the room, from the folio QR. |
| `/kitchen` | Tokens, the three planes, and the seal in isolation. |
| `/kitchen/qr` | The printable A4 QR sheet, one code per room. |

Two query parameters exist for looking at things, and neither affects a guest:

- `?slow=8` stretches every duration and delay by 8, so the choreography can be
  watched and photographed at the moments the motion table names.
- `/kitchen/qr?base=https://your-deploy.vercel.app` prints codes pointing at a
  deployment rather than at localhost.

## Tests

```bash
npm test        # pure logic: room parsing, severity, the email
npm run test:ui # the browser suite, needs the app running on :3210
```

`npm run test:ui` expects a production build being served:

```bash
npm run build && npx next start -p 3210
```

Set `BASE_URL` to point the browser suite somewhere else, for example a preview
deployment.

Several assertions here are about things a screenshot cannot show: the note's
paint order during the seal, whether anything was written before the undo window
closed, whether a secret reached the client bundle. Those are paired with teeth
checks that deliberately break the thing being asserted and confirm the assertion
notices. An assertion about an illusion is very easy to write vacuously, and a
green that cannot go red is worse than no test.

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional, and the guest
flow is identical without any of them:

- No `GROQ_API_KEY`: every verdict comes from the local heuristic.
- No Supabase: nothing is stored.
- No Resend: no email is sent.

That is deliberate. There is no error state in the guest UI, because a guest told
the intercept failed will go and write the public review instead, which is the
exact outcome this product exists to prevent.

## Deploying

1. Run `supabase/schema.sql` once against the Supabase project.
2. Set the environment variables from `.env.example` in the Vercel project.
   `SUPABASE_SERVICE_ROLE_KEY` is the service role key, never the anon key.
3. Deploy. `NEXT_PUBLIC_SITE_URL` should be the deployed origin so the QR sheet
   prints working codes.
4. Open `/kitchen/qr`, print at A4, cut on the dashed lines, and put one code in
   the corner of each folio.

## Smoke test, on a real phone

A simulator will not catch the two failures that matter most: a printed code that
will not scan at arm's length under lobby lighting, and a commit lost when the
handset locks. Both need a real device.

- [ ] Scan a printed code. The room number reaches the email.
- [ ] Complete a serious path. The recovery offer appears and the subject line
      starts with `Guest waiting`.
- [ ] Complete a minor path. No recovery offer.
- [ ] Take the quiet exit from screen 0. A row is written with severity `none`
      and no email fires.
- [ ] Press Undo. No row and no email.
- [ ] Seal, then lock the phone immediately. The row and the email still arrive.
- [ ] Turn on Reduce Motion in iOS settings and run the whole flow.
- [ ] Put the phone in airplane mode after the Send press. The seal still
      completes and the guest sees no error.

The browser suite covers the logic behind six of these, including the offline
path and the beacon transport. It cannot cover a camera or a locked handset.

## Done

The demo is finished when a GM can be handed a phone, scan a printed code, and
receive an email in their own inbox within ten seconds, with nothing on screen
ever having said the word AI.
