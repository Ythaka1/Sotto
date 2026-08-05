'use client';

import { useState } from 'react';
import { Plane } from '@/components/Plane';
import type { Level } from '@/components/Plane';

/*
 * Step 3. The three planes, live.
 *
 * Static swatches prove the values compiled. This proves they read as depth
 * when something actually moves between them, which is the only question that
 * matters: a guest never sees two planes side by side, they see one surface
 * change.
 */

const LEVELS: { level: Level; label: string; note: string }[] = [
  { level: 'rest', label: 'rest', note: 'Where everything sits' },
  { level: 'lift', label: 'lift', note: 'Focused, or sealed' },
  { level: 'fly', label: 'fly', note: 'Airborne only, never at rest' },
];

export function PlanesDemo() {
  const [level, setLevel] = useState<Level>('rest');
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-12">
      {/* The three, side by side, so the steps between them are legible. */}
      <div className="grid gap-8 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <div key={l.level}>
            <Plane
              level={l.level}
              radius={l.level === 'fly' ? 'small' : 'card'}
              className="mb-4 flex h-36 items-center justify-center"
            >
              <span className="t-label">{l.label}</span>
            </Plane>
            <p className="t-example text-muted">{l.note}</p>
          </div>
        ))}
      </div>

      {/* One surface moving between planes, which is what a guest actually
          experiences. */}
      <div>
        <p className="t-label mb-4">One surface, moving</p>
        <Plane level={level} className="mb-5 flex h-44 items-center justify-center px-6">
          <p className="t-body text-muted text-center">
            Currently on {level}.
          </p>
        </Plane>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.level}
              type="button"
              onClick={() => setLevel(l.level)}
              aria-pressed={level === l.level}
              className={`rounded-pill t-chip px-4 py-2.5 transition ease-standard ${
                level === l.level
                  ? 'on-ink bg-ink text-plane'
                  : 'bg-plane shadow-rest text-ink'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* The real screen 1 interaction: rest to lift on focus. */}
      <div>
        <p className="t-label mb-4">Focus lift, as on the question card</p>
        <Plane level={focused ? 'lift' : 'rest'} className="p-2">
          <textarea
            rows={3}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=""
            aria-label="Focus this to see the card lift"
            className="t-body w-full resize-none rounded-[20px] bg-transparent p-4 outline-none"
          />
        </Plane>
        <p className="t-example text-muted mt-4">
          Tab into the field. The card goes to lift and returns to rest on blur, over 220ms.
        </p>
      </div>
    </div>
  );
}
