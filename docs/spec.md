# Sotto: guest flow specification

A pre review intercept for boutique hotels. A guest scans a QR code on their folio at
checkout, answers one or two quiet questions, and their answer is sealed and routed
privately to the general manager before it can become a public review.

Demo property: **The Aubrey**. Fictional. No real hotel name appears anywhere in code,
copy, or seed data.

This document is the contract. Nothing gets built until it is read and approved.

---

## 0. What the flow is actually doing

The guest has a taxi outside and a bag in one hand. They are three taps from a public
review that costs the property money for two years. Sotto's job is to be faster, quieter,
and more obviously private than the review site, and to get a duty manager standing in
front of the guest while they are still in the lobby.

Everything below serves that. Motion is not decoration here. The seal is the moment the
guest believes the thing is private, and belief is the product.

### What I took from the reference video

Six specific things, all of which are in the spec below:

1. Cards arrive **already tilted and already in motion**, from above, overlapping into a
   loose stack. They never appear flat and they never appear together.
2. The ground is a hair darker than the surfaces. Depth comes entirely from wide, soft,
   downward shadows, not from borders and not from blur.
3. Body copy resolves as a **line reveal**, not a fade of the whole block. It reads as
   settling rather than switching on.
4. The primary action is a full width dark pill pinned low, always in the same place on
   every screen, so the thumb never hunts.
5. The back chevron is a small circular plane top left, floating on the ground, not
   attached to a header bar.
6. Very few elements per screen. Enormous vertical breathing room. The screens in the
   reference average four objects. Ours will too.

---

## 1. The z layer stack

Three planes. There is no fourth. Blur and glass are forbidden: on a light ground glass
turns to mud, and it costs framerate on the mid range Android phones this actually runs on.

The ground is the ground, not a plane. It never carries a shadow.

| | Fill | Default radius | Contact shadow | Ambient shadow |
|---|---|---|---|---|
| **Ground** | `--ground` `#F1F0EE` | `0` | none | none |
| **Plane 1: rest** | `--plane` `#FAFAF9` | `28px` | `0 1px 2px rgba(23,24,26,.04)` | `0 12px 32px -8px rgba(23,24,26,.08)` |
| **Plane 2: lift** | `--plane` `#FAFAF9` | `28px` | `0 1px 2px rgba(23,24,26,.05)` | `0 24px 48px -10px rgba(23,24,26,.16)` |
| **Plane 3: fly** | `--plane` `#FAFAF9` | `22px` | `0 2px 4px rgba(23,24,26,.05)` | `0 30px 60px -12px rgba(23,24,26,.22)` |

Radius belongs to the component, not the plane. The plane is defined by its fill and its
pair of shadows. Component radii:

- Cards: `28px`
- Small flying cards: `22px`
- Buttons and chips: `999px`
- Back chevron plane: `999px` (38px circle)

### What lives on each plane

**Ground.** The page. Never raised, never shadowed.

**Plane 1, rest.** The question card. The follow up card. The chips. The primary button
(fill is `--ink`, not `--plane`, the shadow pair is rest). The back chevron. The sealed
card before it seals.

**Plane 2, lift.** The textarea card while focused. The sealed card from the moment the
flap closes. The recovery offer.

**Plane 3, fly.** The three example cards on screen 0 while they are airborne, for the
duration of their entry only. They land on plane 1. Nothing sits on plane 3 at rest.

Plane 3 is a transient. If something is still on plane 3 after 800ms, that is a bug.

### The one exception, stated plainly

The primary button is filled `--ink`, not `--plane`. It is the only raised surface that
is not `--plane`, because it is the only surface that is an action rather than a
container. It carries the plane 1 shadow pair. Pressing it does not change its plane. It
only scales.

---

## 2. Tokens

CSS custom properties on `:root`, named by role.

```css
:root {
  /* Colour */
  --ground:  #F1F0EE;  /* page ground, flat, no shadow */
  --plane:   #FAFAF9;  /* every raised surface */
  --ink:     #17181A;  /* type and the primary button */
  --muted:   #6E7075;  /* secondary type */
  --seal:    #2E4739;  /* two places only */

  /* Elevation */
  --shadow-rest: 0 1px 2px rgba(23,24,26,.04), 0 12px 32px -8px rgba(23,24,26,.08);
  --shadow-lift: 0 1px 2px rgba(23,24,26,.05), 0 24px 48px -10px rgba(23,24,26,.16);
  --shadow-fly:  0 2px 4px rgba(23,24,26,.05), 0 30px 60px -12px rgba(23,24,26,.22);

  /* Radius */
  --r-card:  28px;
  --r-small: 22px;
  --r-pill:  999px;

  /* Motion */
  --ease-standard: cubic-bezier(.22, 1, .36, 1);
  --ease-spring:   cubic-bezier(.34, 1.56, .64, 1);
  --dur-standard:  220ms;
  --dur-spring:    420ms;
  --dur-seal:      700ms;
  --stagger:       85ms;
}
```

`--seal` `#2E4739` is used in **exactly two places** in the entire product:

1. The pine mark that springs in during the seal on screen 3, and the ring that pulses out
   of it. The mark and its ring are one object.
2. A 6px dot immediately before the privacy line on screen 0.

The dot is the argument. It is the only spot of colour a guest sees before they type, it
sits against the sentence promising the answer goes straight to the general manager, and
the same green comes back as the mark at the moment that promise is kept. Nothing else in
the product is ever this colour. Using `--seal` for a third thing breaks the payoff, so
there is no third thing.

### Tailwind theme extension

Tailwind 4 replaced `tailwind.config.ts` with an in CSS `@theme` block, so the theme lives
in `app/globals.css` alongside the tokens. The names are the same either way.

```css
@theme {
  --shadow-rest: 0 1px 2px rgba(23,24,26,.04), 0 12px 32px -8px rgba(23,24,26,.08);
  --shadow-lift: 0 1px 2px rgba(23,24,26,.05), 0 24px 48px -10px rgba(23,24,26,.16);
  --shadow-fly:  0 2px 4px rgba(23,24,26,.05), 0 30px 60px -12px rgba(23,24,26,.22);
  --radius-card: 28px;
  --radius-small: 22px;
  --radius-pill: 999px;
  --ease-standard: cubic-bezier(.22, 1, .36, 1);
  --ease-spring:   cubic-bezier(.34, 1.56, .64, 1);
  --font-sans: 'General Sans', var(--font-substitute), ui-sans-serif, system-ui, sans-serif;
}

@theme inline {
  --color-ground: var(--ground);
  --color-plane:  var(--plane);
  --color-ink:    var(--ink);
  --color-muted:  var(--muted);
  --color-seal:   var(--seal);
}
```

**Why the two blocks differ.** `--shadow-*`, `--radius-*`, `--ease-*` and `--font-*` are
Tailwind namespace keys. Writing `--shadow-rest: var(--shadow-rest)` there would point a
variable at itself, and the utility compiles to a transparent shadow with no error at
build time or in the browser. So anything whose token name collides with a namespace
carries its literal value in `@theme`, which emits it onto `:root` anyway. Colours do not
collide, because Tailwind's key is `--color-ground` and the token is `--ground`, so those
keep the `inline` indirection and stay overridable from one place.

Durations are not a Tailwind namespace, so `--duration-*` and `--stagger` live in `:root`.
That is what lets the reduced motion media query override them.

There is no `gray-500` in this product. If a colour is not one of the five above, it does
not get used.

---

## 3. Typeface

**General Sans**, from Fontshare (Indian Type Foundry). One family for the entire product.
Weights 400, 500, 600.

A display serif is forbidden. The product's whole argument is that it is not performing at
the guest. A serif performs.

### The honest part

General Sans is genuinely available from Fontshare and is the right choice. It is **not on
Google Fonts**, and it is **not on npm** under any Fontsource package. I checked both.

I also checked whether I can fetch it from this build environment, and I cannot:
`api.fontshare.com` and `cdn.fontshare.com` are both blocked by this session's network
policy (403 at the proxy). `fonts.googleapis.com` and `registry.npmjs.org` are reachable.

So there are three options and I want your call before I build. My recommendation is the
first.

**Option A, recommended.** You download the General Sans woff2 files from
fontshare.com/fonts/general-sans and drop them into `public/fonts/`. I wire them with
`next/font/local`. This self hosts the font, which is correct for production anyway: no
third party request on the critical path, no flash of fallback text on slow hotel wifi,
and the font is served from the same origin as the page. Four files, about 120kb total.
Until they land I build against the substitute below and swap in one line.

**Option B.** I load Fontshare's CDN with a `<link>` tag. This works fine for a real guest
on a real phone and needs nothing from you. It costs a render blocking request to a third
party, and I cannot see it or screenshot it from here, so every screenshot I send you
during the build would be in the wrong typeface.

**Option C.** We abandon General Sans and use **Plus Jakarta Sans** (Google Fonts, by
Tokotype) for real. It is the closest widely available match: same geometric humanist
skeleton, same low contrast, similar open apertures, slightly narrower. It is a good
typeface. It is not the same typeface.

**Named substitute, in every case:** where General Sans is unavailable, I use **Plus
Jakarta Sans**, and I will say so on any screenshot taken before the real files land. I
will not swap it silently.

Fallback stack in CSS, in order:

```css
font-family: 'General Sans', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
```

### Scale

| Role | Size | Line height | Weight | Tracking | Colour |
|---|---|---|---|---|---|
| Question | 26px | 1.25 | 500 | -0.015em | `--ink` |
| Body | 16px | 1.5 | 400 | 0 | `--ink` |
| Secondary body | 16px | 1.5 | 400 | 0 | `--muted` |
| Label | 12px | 1.2 | 500 | 0.16em, uppercase | `--muted` |
| Button | 16px | 1 | 500 | -0.01em | `--plane` on `--ink` |
| Chip | 15px | 1 | 400 | 0 | `--ink` |
| Example card line | 14px | 1.4 | 400 | 0 | `--ink` |
| Undo | 14px | 1 | 400 | 0 | `--muted`, underlined |

At 360px the question stays at 26px. Card padding drops from 28px to 20px instead.
Shrinking the question is the wrong trade: it is the only thing on the screen that matters.

---

## 4. Motion table

Three moves, used consistently, and nothing else.

- **Tilt.** Cards enter already rotated between 2 and 14 degrees and settle at a smaller
  angle. They never enter flat.
- **Spring.** `cubic-bezier(.34, 1.56, .64, 1)` for anything that arrives or is pressed.
  Slight overshoot, then settle.
- **Stagger.** Grouped elements land 85ms apart, never together.

Standard easing for everything else is `cubic-bezier(.22, 1, .36, 1)` at 220ms. The seal
is the only thing allowed to run longer.

All of it is Framer Motion. No WebGL, no three.js. What reads as 3D is plain transforms
with `perspective: 1200px` on the parent.

### Screen 0, arrival

| # | Element | Trigger | Delay | Duration | Easing | From → to |
|---|---|---|---|---|---|---|
| 0.1 | Example card 3 (back) | mount | 0 | 560ms | spring | `y -140 → 0`, `rotate -14deg → -6deg`, `scale .92 → 1`, `opacity 0 → 1` (opacity over first 160ms) |
| 0.2 | Example card 2 (middle) | mount | 85ms | 560ms | spring | `y -140 → 0`, `rotate 9deg → 4deg`, `scale .92 → 1`, opacity as above |
| 0.3 | Example card 1 (front) | mount | 170ms | 560ms | spring | `y -140 → 0`, `rotate 6deg → -2deg`, `scale .92 → 1`, opacity as above |
| 0.4 | Each card's shadow | own landing | +0 | 220ms | standard | `fly → rest` |
| 0.5 | Heading | mount | 520ms | 220ms | standard | `y 14 → 0`, `opacity 0 → 1` |
| 0.6 | Privacy line and seal dot | mount | 605ms | 220ms | standard | `y 14 → 0`, `opacity 0 → 1` |
| 0.7 | Primary button | mount | 690ms | 220ms | standard | `y 14 → 0`, `opacity 0 → 1` |

Interactive at 910ms. The text starts arriving at 520ms, while the last card is still
settling, so the screen reads as one gesture rather than two sequential events.

### Screen transitions, everywhere

| # | Element | Trigger | Delay | Duration | Easing | From → to |
|---|---|---|---|---|---|---|
| T.1 | Outgoing screen | navigate | 0 | 160ms | standard | `opacity 1 → 0`, `y 0 → -8` |
| T.2 | Incoming screen | navigate | 160ms | 220ms | standard | `opacity 0 → 1`, `y 12 → 0` |
| T.3 | Back chevron | enter screen 1 or 2 | 0 | 220ms | spring | `scale .8 → 1`, `opacity 0 → 1` |
| T.4 | Back chevron | leave screen 1 or 2 | 0 | 160ms | standard | `scale 1 → .8`, `opacity 1 → 0` |

Going back runs T.1 and T.2 with the y values inverted, so backward motion reads as
backward.

### Screen 1, the question

| # | Element | Trigger | Delay | Duration | Easing | From → to |
|---|---|---|---|---|---|---|
| 1.1 | Question text | screen enter | 0 | 220ms | standard | `y 12 → 0`, `opacity 0 → 1` |
| 1.2 | Textarea card | screen enter | 85ms | 420ms | spring | `y 20 → 0`, `rotate 2deg → 0`, `opacity 0 → 1` |
| 1.3 | Chips, each of four | screen enter | 170ms, +85ms each | 420ms | spring | `y 16 → 0`, `scale .94 → 1`, `opacity 0 → 1` |
| 1.4 | Textarea card | focus | 0 | 220ms | standard | shadow `rest → lift`, `y 0 → -2` |
| 1.5 | Textarea card | blur | 0 | 220ms | standard | shadow `lift → rest`, `y -2 → 0` |
| 1.6 | Chip | press | 0 | 180ms | spring | `scale 1 → .96 → 1` |
| 1.7 | Continue button | field goes from empty to non empty | 0 | 220ms | standard | `opacity .4 → 1` |
| 1.8 | Primary button | press | 0 | 180ms | spring | `scale 1 → .97 → 1` |

Chip presses fill the textarea with an editable starter sentence. A guest with a taxi
waiting will not type from nothing.

### Screen 2, follow up

Same as screen 1 rows 1.1, 1.2, 1.4, 1.5, 1.8. No chips. The question text swaps in with
T.2 only, no extra treatment: the branch in wording should be invisible as a mechanism.

### Screen 3, the seal

This is the signature. It is the only place the motion budget gets spent. `t` is measured
from the press of "Send privately".

| # | Element | Trigger | Delay | Duration | Easing | From → to |
|---|---|---|---|---|---|---|
| 3.1 | Send button | press | 0 | 180ms | spring | `scale 1 → .97 → 1` |
| 3.2 | **Flap** | press | 0 | **700ms** | standard | `rotateX(-92deg) → rotateX(0)`, `transform-origin: top center`, parent `perspective: 1200px`, `backface-visibility: hidden` |
| 3.3 | Card body | press | 0 | 700ms | standard | `y 0 → -5px`, shadow `rest → lift` |
| 3.4 | Pine mark | press | 540ms | 420ms | spring | `scale .4 → 1`, `rotate -8deg → 0`, `opacity 0 → 1` |
| 3.5 | Ring | press | 620ms | 900ms | standard | `scale .55 → 2.3`, `opacity .45 → 0`, once, no repeat |
| 3.6 | Sealed line | press | 900ms | 220ms | standard | `y 10 → 0`, `opacity 0 → 1` |
| 3.7 | Undo | press | 985ms | 220ms | standard | `y 10 → 0`, `opacity 0 → 1` |
| 3.8 | Recovery offer, serious only | press | 1300ms | 480ms | spring | `y 24 → 0`, `rotate 4deg → 0`, `scale .96 → 1`, shadow `lift` |

The flap and the lift run together on the same 700ms so the card reads as one object
closing, not as a lid and a box. The mark lands at 540ms, while the flap is still moving,
which is what makes it feel pressed into the closing card rather than stamped onto a
finished one.

Screenshot checkpoints for the isolated component at `/kitchen`: **0ms** (open, flat,
words visible), **350ms** (flap at roughly half fold, words half covered), **700ms**
(closed and lifted, mark landed, ring mid pulse), **1200ms** (ring gone, sealed line and
Undo in place).

### Screen 4, close

| # | Element | Trigger | Delay | Duration | Easing | From → to |
|---|---|---|---|---|---|---|
| 4.1 | "Safe travels." | screen enter | 0 | 220ms | standard | `y 10 → 0`, `opacity 0 → 1` |

Nothing else. No confirmation card, no summary, no receipt. The guest is done and the
screen should feel done.

### Reduced motion

`prefers-reduced-motion: reduce` is built into the first component, not bolted on at the
end. A `useReducedMotion()` hook feeds a single `duration` helper that every animated
component reads from. There is no component that animates without going through it.

- Every duration collapses to **1ms**. Every delay collapses to **0**.
- Every stagger collapses to **0**.
- The **ring pulse (3.5) is dropped entirely**, not shortened. A ring that expands in 1ms
  is a flash, and a flash is worse than nothing.
- The flap (3.2) renders in its **closed** state immediately. The seal still happens, it
  just does not perform.
- Opacity transitions are kept at 1ms rather than removed, so nothing pops in without
  having existed.

---

## 5. Screens

Layout is a single column, max width 420px, centred, with the primary action pinned to a
consistent low position on every screen so the thumb never hunts. Responsive down to 360px.

### Screen 0, arrival

Straight after the scan. Three small cards fly in from above with tilt and spring,
staggered, and settle into a loose overlapping stack. They carry anonymised one line
examples from other rooms, which quietly teaches the guest what kind of answer is wanted
without ever instructing them.

Then the heading, the privacy line, and the button stagger in beneath.

```
Heading:  Before you go, one quiet question.
Privacy:  ● Thirty seconds. It goes straight to the general manager and is never
            published.
Button:   Start
```

The `●` is the 6px `--seal` dot. Example card copy, seeded for The Aubrey:

```
"The shower took a while to warm up."          Room 12
"Check in was quick but the lift was hard to find."   Room 4
"Breakfast ran out of oat milk by nine."       Room 21
```

Each card shows the line in example card type and the room in label type. No names, no
dates, no ratings. These are illustrative seed strings, not real guest data, and they are
labelled as such in the seed file.

No back chevron on this screen.

### Screen 1, the question

```
Question: Was there one small thing we could have done better?
```

A textarea in a raised card that lifts its shadow on focus. Placeholder is empty, not a
prompt: a placeholder here would be the interface talking over the guest.

Four chips underneath: `room comfort`, `check in`, `breakfast`, `noise`. Tapping one fills
the field with an editable starter sentence and puts the cursor at the end:

| Chip | Fills with |
|---|---|
| room comfort | `The room was ` |
| check in | `Check in was ` |
| breakfast | `Breakfast was ` |
| noise | `It was noisy ` |

Continue is disabled until there is text. Disabled means `opacity .4` and
`pointer-events: none`, and it is still in the tab order with `aria-disabled`, so a
keyboard or screen reader guest is told why rather than finding a dead control.

Back chevron top left, 38px circular plane.

### Screen 2, follow up

One question only. Its wording branches on severity.

| Severity | Question |
|---|---|
| serious | That should not have happened. When was it? |
| minor | Anything else worth knowing? |

Textarea, same card as screen 1. No chips. Continue is enabled here even when empty: this
question is optional and the guest has already given us the thing that matters.

Back chevron top left.

### Screen 3, the seal

The card holding their words folds closed over them, per the motion table. Then:

```
Sealed. Only the manager reads this.        Undo
```

Undo returns the guest to their answer on screen 1, with the text intact, and cancels the
send. Nothing has left the device before the seal completes.

Then, and only if severity is serious, the recovery offer appears:

```
Would you like Daniel, the duty manager, to find you before you leave?
[ Yes, please ]   [ No thank you ]
```

This is the commercial heart of the product. A complaint intercepted while the guest is
still in the lobby is a complaint that never reaches a review site. Both answers are
recorded. "No thank you" is not a failure state and is never treated as one.

No back chevron on this screen.

### Screen 4, close

```
Safe travels.
```

No back chevron.

### Back chevron

38px circular plane, `--plane`, plane 1 shadow, chevron in `--ink`. Sits top left, 20px
from each edge, floating on the ground with no header bar behind it. Present on screens 1
and 2. Hidden everywhere else. Its tap target is padded to 44px even though the visible
plane is 38px.

---

## 6. Copy rules

These apply to every string in the product, including error paths, `aria-label`s, and the
manager email.

- No em dashes. No hyphens used as punctuation. Rewrite the sentence instead.
- Sentence case everywhere. No exclamation marks.
- The interface never apologises and never explains itself. If a guest says the room was
  cold, the reply is "Thank you for telling us," not "our system was being serviced."
- Buttons say what happens: "Send privately", not "Submit".

Full button inventory, so this stays honest:

| Screen | Button | Says |
|---|---|---|
| 0 | primary | Start |
| 1 | primary | Continue |
| 2 | primary | Send privately |
| 3 | text | Undo |
| 3 | recovery yes | Yes, please |
| 3 | recovery no | No thank you |

---

## 7. Architecture

Next.js 15 App Router, TypeScript, Tailwind, Framer Motion. Guest route is
`/f/[property]`. Component sandbox is `/kitchen`.

### Severity: one call, once, at the end

Severity is a single JSON mode call to Groq `llama-3.1-8b-instant`, made once per guest at
the end of the session, not per turn. One request per guest keeps this inside the free
tier.

```ts
type Verdict = {
  severity: 'serious' | 'minor';
  theme: string;        // short noun phrase, lowercase
  summary: string;      // one sentence for the manager
  recoverable: boolean; // can a duty manager still fix this in the lobby
};
```

That same call writes the manager email body.

**The scheduling problem, and how it resolves.** Screen 2's wording branches on severity,
but screen 2 happens before the end of the session. Screen 3's recovery offer also depends
on severity. So:

- **Screen 2 wording** uses a local heuristic, synchronously, with no network call. Tier 1.
- **The model call fires the moment "Send privately" is pressed**, concurrently with the
  seal animation. The flap takes 700ms and the recovery offer does not appear until
  1300ms, which gives the call a 1.3 second budget on an 8b model that typically answers
  in well under that.
- **If the verdict has not arrived by 1300ms**, the recovery offer falls back to the local
  heuristic and the flow continues without a pause. The verdict is still awaited in the
  background for the email and the stored row.

The seal animation is not decoration hiding latency. It happens to be exactly long enough
to cover it, which is the reason it can afford to be the one slow thing in the product.

### The three tier `respond()` pattern

Reused from the StayMate demo.

1. **Scripted opener.** The screen 0 and screen 1 questions, the chip starter sentences,
   and the sealed line are fixed strings. Zero latency, zero cost, zero risk.
2. **Model.** One Groq JSON mode call for the verdict and the manager email body.
3. **Scripted fallback.** If Groq is unreachable, times out, or returns malformed JSON, a
   local keyword and intensity heuristic produces the verdict and a templated email goes
   out instead.

**The guest never sees an error.** There is no error state in the guest UI, no retry
button, no toast. Under every failure mode the seal completes identically and the guest
gets "Sealed. Only the manager reads this." If the write fails, it retries once in the
background and then queues; the guest's experience does not change. A guest who is told
the intercept failed will go and write the public review instead, which is the exact
outcome the product exists to prevent.

### Storage

Supabase, one `responses` table.

```sql
create table responses (
  id                 uuid primary key default gen_random_uuid(),
  property_slug      text        not null,
  room               text,                 -- from ?r= on the folio QR, null if absent
  answer             text        not null,
  follow_up_question text,
  follow_up_answer   text,
  severity           text        not null check (severity in ('serious','minor')),
  theme              text,
  summary            text,
  recoverable        boolean     not null default false,
  recovery_requested boolean,             -- null when never offered
  verdict_source     text        not null check (verdict_source in ('model','fallback')),
  created_at         timestamptz not null default now()
);
```

`recovery_requested` is nullable on purpose: null means the offer was never shown, false
means it was shown and declined. Those are different facts and collapsing them would lose
the only number that tells you whether the offer works.

`verdict_source` records whether the row was classified by the model or by the fallback,
so the fallback's accuracy is measurable rather than assumed.

Writes go through a server route with the service role key. No Supabase key of any kind
reaches the browser.

### The room parameter

The QR code printed on the folio is per room, not per property. It encodes:

```
/f/the-aubrey?r=14
```

`r` is read from the query string on arrival, held in session state for the length of the
flow, and written to `responses.room`. It is never shown to the guest and never asked for.
The folio already knows the room, so asking would be the interface explaining itself.

**Why this is load bearing.** Without it the recovery offer is not actionable. Telling
Daniel that a guest somewhere in the building is upset and would like to be found before
they leave is not an intercept, it is a riddle. The room number is the difference between
a duty manager walking to a door and a duty manager reading an email.

Rules:

- Absent or unparseable `r` is not an error and never blocks the flow. The row stores null.
- Accept up to 8 characters matching `^[A-Za-z0-9-]{1,8}$` so that `14`, `2B` and `Suite-3`
  all work. Anything else is treated as absent rather than stored dirty.
- The value is echoed nowhere in the guest UI, so a mistyped QR cannot confuse a guest.

**The tension, stated once.** Attaching a room number makes the response identifiable to
the manager. That is the point, and it is what makes recovery possible. It also means the
product must never claim the answer is anonymous, only that it is private and unpublished.
The screen 0 privacy line says "goes straight to the general manager and is never
published", which stays true. No copy anywhere may upgrade that to anonymity.

### Email

Resend, to the manager's inbox, one email per guest, sent server side after the write.
Subject and body come from the model call. Subject line pattern:

```
The Aubrey, room 14: <theme>
```

When `r` is absent the room clause is **omitted entirely**:

```
The Aubrey: <theme>
```

The subject never asserts an absence. A line reading "room not given" on every email is
noise that trains the manager to skim the subject, and it makes the common case look like
a fault. Say the room when it is known and say nothing when it is not.

When recovery is accepted the room moves to the front of the body as well, because that is
the one fact Daniel acts on and he is reading it on a phone while walking.

The email obeys the copy rules. It does not apologise on the property's behalf and it does
not editorialise. It states the room when known, what the guest said, the theme, the
severity, whether recovery was offered and accepted, and the time.

### File tree

```
app/
  f/[property]/page.tsx         guest flow, client orchestrator
  kitchen/page.tsx              planes, swatches, seal in isolation
  api/seal/route.ts             verdict + write + email, one POST
components/
  Plane.tsx                     the three planes, one component
  ExampleCard.tsx               screen 0 flying cards
  QuestionCard.tsx              textarea card, focus lift
  Chips.tsx
  PrimaryButton.tsx
  BackChevron.tsx
  Seal.tsx                      the flap, mark, ring, sealed line
  RecoveryOffer.tsx
lib/
  motion.ts                     duration helper, reduced motion, variants
  room.ts                       ?r= parsing, email subject
  respond.ts                    three tier: scripted, model, fallback
  severity.ts                   local heuristic
  groq.ts
  supabase.ts
  email.ts
  seed/aubrey.ts                The Aubrey, fictional
styles/globals.css              tokens
docs/spec.md                    this file
```

### Out of scope

No dashboard. No authentication. No analytics. No multi property admin. No SMS. No
billing. Every one of those is a place to hide from the work that decides whether this
sells.

---

## 8. The bar

- Responsive to 360px, tested at 360, 390, and 430.
- Visible keyboard focus everywhere: `2px solid var(--ink)`, `outline-offset: 3px`. On the
  dark button the ring is `var(--plane)` at the same width and offset. No new colours and
  no removed outlines.
- `prefers-reduced-motion` respected, built in from the first component.
- Tap targets 44px minimum, including the back chevron.
- The textarea does not zoom the viewport on iOS, which means its font size never goes
  below 16px.
- A guest holding a phone in one hand with a bag in the other finishes this in thirty
  seconds without thinking about it once.

---

## 9. Build order

Small steps, screenshot each one before moving on.

1. **This spec.** Then stop and wait.
2. Tokens as CSS custom properties plus the Tailwind theme extension. Screenshot a swatch
   sheet.
3. The three planes as a live demo page at `/kitchen`. Screenshot.
4. Screen 0 with the fly in. Screenshot. This is where the product either feels alive or
   feels like a form, so iterate until it does.
5. Screens 1 and 2, back chevron included.
6. The seal component in isolation at `/kitchen`. Screenshot at 0ms, 350ms, 700ms, 1200ms.
7. Wire the flow together.
8. Groq, Supabase, Resend.
9. Seed The Aubrey and deploy to Vercel.

---

## 10. What I need from you before step 2

1. **The font.** Option A, B, or C from section 3. A is my recommendation and needs you to
   download four woff2 files from Fontshare.
2. **Keys, when we reach step 8.** `GROQ_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and the manager inbox address for The
   Aubrey. Not needed before then. Steps 2 through 7 run entirely without them.

Everything else in this document is decided. Tell me what is wrong with it and I will
change it before a line of code exists.
