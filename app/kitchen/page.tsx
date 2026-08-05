import type { Metadata } from 'next';
import { PlanesDemo } from './PlanesDemo';

export const metadata: Metadata = { title: 'Sotto kitchen' };

/*
 * The kitchen is where the parts get looked at on their own before they go into
 * the flow. It is not part of the guest experience and never links to it.
 *
 * Step 2: tokens.
 */

const colours = [
  { name: '--ground', hex: '#F1F0EE', role: 'Page ground, flat, no shadow' },
  { name: '--plane', hex: '#FAFAF9', role: 'Every raised surface' },
  { name: '--ink', hex: '#17181A', role: 'Type and the primary button' },
  { name: '--muted', hex: '#6E7075', role: 'Secondary type' },
  { name: '--seal', hex: '#2E4739', role: 'Two places only' },
];

/* Utility classes are spelled out in full rather than built from strings so
   Tailwind's scanner can see them, and so this page proves the utilities work
   instead of bypassing them with inline styles. */
const planes = [
  {
    name: 'Plane 1',
    token: 'rest',
    box: 'shadow-rest rounded-card',
    radius: '28px',
    holds: 'Question card, chips, primary button, back chevron',
    contact: '0 1px 2px rgba(23,24,26,.04)',
    ambient: '0 12px 32px -8px rgba(23,24,26,.08)',
  },
  {
    name: 'Plane 2',
    token: 'lift',
    box: 'shadow-lift rounded-card',
    radius: '28px',
    holds: 'Focused textarea, the sealed card, the recovery offer',
    contact: '0 1px 2px rgba(23,24,26,.05)',
    ambient: '0 24px 48px -10px rgba(23,24,26,.16)',
  },
  {
    name: 'Plane 3',
    token: 'fly',
    box: 'shadow-fly rounded-small',
    radius: '22px',
    holds: 'Airborne example cards only. Transient. Nothing rests here.',
    contact: '0 2px 4px rgba(23,24,26,.05)',
    ambient: '0 30px 60px -12px rgba(23,24,26,.22)',
  },
];

const type = [
  { cls: 't-question', label: 'Question', spec: '26 / 1.25 / 500 / -0.015em', sample: 'Was there one small thing we could have done better?' },
  { cls: 't-body', label: 'Body', spec: '16 / 1.5 / 400', sample: 'It goes straight to the general manager and is never published.' },
  { cls: 't-body text-muted', label: 'Secondary body', spec: '16 / 1.5 / 400, muted', sample: 'Thirty seconds.' },
  { cls: 't-label', label: 'Label', spec: '12 / 0.16em / uppercase', sample: 'Room 12' },
  { cls: 't-chip', label: 'Chip', spec: '15 / 1 / 400', sample: 'room comfort' },
  { cls: 't-example', label: 'Example card line', spec: '14 / 1.4 / 400', sample: '"The shower took a while to warm up."' },
];

const motion = [
  { name: '--ease-standard', value: 'cubic-bezier(.22, 1, .36, 1)', use: 'Everything that is not arriving or pressed' },
  { name: '--ease-spring', value: 'cubic-bezier(.34, 1.56, .64, 1)', use: 'Anything that arrives or is pressed' },
  { name: '--duration-standard', value: '220ms', use: 'The default' },
  { name: '--duration-spring', value: '420ms', use: 'Arrivals' },
  { name: '--duration-seal', value: '700ms', use: 'The flap. The only long one.' },
  { name: '--stagger', value: '85ms', use: 'Grouped elements, never together' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20">
      <h2 className="t-label mb-6">{title}</h2>
      {children}
    </section>
  );
}

export default function Kitchen() {
  return (
    <main className="mx-auto max-w-[880px] px-6 py-16">
      <header className="mb-16">
        <h1 className="t-question mb-3">Sotto kitchen</h1>
        <p className="t-body text-muted max-w-[52ch]">
          Step 2, tokens. Every value the product is allowed to use. If a colour, shadow,
          radius or curve is not on this page, it does not appear anywhere in the flow.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {colours.map((c) => (
            <div
              key={c.name}
              className="rounded-card bg-plane p-4 shadow-rest"
            >
              <div
                className="mb-4 h-20 w-full rounded-small"
                style={{
                  background: c.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(23,24,26,.06)',
                }}
              />
              <p className="t-example font-medium">{c.name}</p>
              <p className="t-example text-muted tabular-nums">{c.hex}</p>
              <p className="t-example text-muted mt-2 leading-snug">{c.role}</p>
            </div>
          ))}
        </div>
        <p className="t-body text-muted mt-6 max-w-[62ch]">
          <span className="bg-seal mr-2 inline-block h-[6px] w-[6px] rounded-pill align-middle" />
          The seal green appears in exactly two places in the whole product: the pine mark
          and its ring at the moment of sealing, and this dot in front of the privacy line
          on the arrival screen. The dot makes the promise and the mark keeps it. There is
          no third use, because a third use would spend the payoff.
        </p>
      </Section>

      <Section title="Elevation">
        <div className="grid gap-4 sm:grid-cols-3">
          {planes.map((p) => (
            <div key={p.token} className="flex flex-col">
              <div
                className={`bg-plane mb-4 flex h-32 items-center justify-center ${p.box}`}
              >
                <span className="t-label">{p.token}</span>
              </div>
              <p className="t-example font-medium">
                {p.name}, {p.radius}
              </p>
              <p className="t-example text-muted mt-1 leading-snug">{p.contact}</p>
              <p className="t-example text-muted leading-snug">{p.ambient}</p>
              <p className="t-example text-muted mt-2 leading-snug">{p.holds}</p>
            </div>
          ))}
        </div>
        <p className="t-body text-muted mt-6 max-w-[62ch]">
          Three planes and no more. No blur and no glass anywhere: on a ground this light
          glass turns to mud, and it costs framerate on the phones this actually runs on.
        </p>
      </Section>

      <Section title="Elevation, live">
        <PlanesDemo />
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap items-end gap-4">
          {[
            { cls: 'rounded-card', label: '28px cards' },
            { cls: 'rounded-small', label: '22px flying cards' },
            { cls: 'rounded-pill', label: '999px buttons and chips' },
          ].map((x) => (
            <div key={x.label}>
              <div className={`bg-plane mb-3 h-24 w-40 shadow-rest ${x.cls}`} />
              <p className="t-example text-muted">{x.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="rounded-card bg-plane p-7 shadow-rest">
          {type.map((t, i) => (
            <div
              key={t.label}
              className={i === 0 ? '' : 'mt-7 border-t border-[rgba(23,24,26,.07)] pt-7'}
            >
              <p className="t-label mb-3">
                {t.label} &middot; {t.spec}
              </p>
              <p className={t.cls}>{t.sample}</p>
            </div>
          ))}
        </div>
        <p className="t-body text-muted mt-6 max-w-[62ch]">
          Rendering in Plus Jakarta Sans, the named substitute. General Sans is the
          specified family and is not on Google Fonts or npm, so it swaps in from
          public/fonts in one line. This is a substitute and is labelled as one.
        </p>
      </Section>

      <Section title="Motion">
        <div className="rounded-card bg-plane p-7 shadow-rest">
          {motion.map((m, i) => (
            <div
              key={m.name}
              className={
                i === 0
                  ? 'flex flex-wrap items-baseline gap-x-4'
                  : 'mt-4 flex flex-wrap items-baseline gap-x-4 border-t border-[rgba(23,24,26,.07)] pt-4'
              }
            >
              <p className="t-example w-[190px] font-medium">{m.name}</p>
              <p className="t-example text-muted w-[220px]">{m.value}</p>
              <p className="t-example text-muted">{m.use}</p>
              {/* Carries the easing utilities so the audit can confirm they
                  compiled, and so they exist for the components that follow. */}
              <span
                aria-hidden
                className={
                  i === 0
                    ? 'ease-standard hidden transition'
                    : i === 1
                      ? 'ease-spring hidden transition'
                      : 'hidden'
                }
              />
            </div>
          ))}
        </div>
        <p className="t-body text-muted mt-6 max-w-[62ch]">
          Under prefers-reduced-motion every duration collapses to 1ms, every delay and
          stagger to 0, and the ring pulse is dropped rather than shortened. A ring that
          expands in 1ms is a flash, and a flash is worse than nothing.
        </p>
      </Section>
    </main>
  );
}
