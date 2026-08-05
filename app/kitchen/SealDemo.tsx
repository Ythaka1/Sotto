'use client';

import { useState } from 'react';
import { Seal } from '@/components/Seal';

/*
 * Step 6. The seal in isolation, before it is wired to anything.
 *
 * The replay key remounts the component, which is the only honest way to watch
 * an entry animation twice.
 */

const SAMPLE = 'The shower took about ten minutes to warm up and I gave up waiting.';

export function SealDemo() {
  const [run, setRun] = useState(0);

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="t-chip rounded-pill bg-ink text-plane on-ink px-5 py-3"
        >
          Replay
        </button>
        <p className="t-example text-muted">
          Append ?slow=8 to watch it at a speed a human can read.
        </p>
      </div>

      <div className="rounded-card bg-ground p-8">
        <Seal key={run} text={SAMPLE} onUndo={() => setRun((r) => r + 1)} />
      </div>
    </div>
  );
}
