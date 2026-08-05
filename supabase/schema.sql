-- Sotto. One table.
--
-- Run this once against the Supabase project before the first pilot.

create table if not exists responses (
  id                 uuid primary key default gen_random_uuid(),
  property_slug      text        not null,
  room               text,                 -- from ?r= on the folio QR, null if absent
  answer             text,                 -- null on the nothing to report path
  follow_up_question text,
  follow_up_answer   text,
  severity           text        not null check (severity in ('serious','minor','none')),
  theme              text,
  summary            text,
  recoverable        boolean     not null default false,
  recovery_requested boolean,              -- null when the offer was never shown
  verdict_source     text        not null check (verdict_source in ('model','fallback')),
  created_at         timestamptz not null default now()
);

-- recovery_requested is nullable on purpose: null means the offer was never
-- shown, false means it was shown and declined. Those are different facts, and
-- collapsing them loses the only number that says whether the offer works.

-- verdict_source records whether the model or the local heuristic classified the
-- row, so the fallback's accuracy stays measurable rather than assumed.

create index if not exists responses_property_created_idx
  on responses (property_slug, created_at desc);

-- Nothing but the service role touches this table. Writes go through the server
-- route only, and no Supabase key of any kind reaches the browser.
alter table responses enable row level security;

-- No policies are defined on purpose. With RLS on and no policy, the anon and
-- authenticated roles can do nothing at all, while the service role bypasses RLS
-- entirely. If a guest facing key ever leaks, it still reads nothing.
