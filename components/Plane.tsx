'use client';

import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useTiming } from '@/lib/motion';

/*
 * The three planes. There is no fourth.
 *
 * A plane is a fill plus a pair of shadows: one tight contact shadow and one
 * wide ambient one. Radius belongs to the component, not the plane, which is
 * why it is a separate prop.
 *
 * No blur and no glass anywhere. On a ground this light glass turns to mud, and
 * it costs framerate on the phones this actually runs on.
 *
 * See docs/spec.md section 1.
 */

export type Level = 'rest' | 'lift' | 'fly';
export type Radius = 'card' | 'small' | 'pill';

/* Read from the compiled custom properties rather than restated here, so the
   tokens stay the single source of truth. */
const SHADOW: Record<Level, string> = {
  rest: 'var(--shadow-rest)',
  lift: 'var(--shadow-lift)',
  fly: 'var(--shadow-fly)',
};

const RADIUS: Record<Radius, string> = {
  card: 'var(--radius-card)',
  small: 'var(--radius-small)',
  pill: 'var(--radius-pill)',
};

type PlaneProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  level?: Level;
  radius?: Radius;
};

export function Plane({
  level = 'rest',
  radius = 'card',
  style,
  children,
  ...rest
}: PlaneProps) {
  const t = useTiming();

  return (
    <motion.div
      /* Animating boxShadow between two multi layer values is one of the few
         things Framer Motion interpolates on the main thread. It is cheap at
         this count and the alternative, crossfading two stacked pseudo
         elements, adds a paint layer per plane for a difference nobody sees. */
      animate={{ boxShadow: SHADOW[level] }}
      transition={t.standard()}
      style={{
        background: 'var(--plane)',
        borderRadius: RADIUS[radius],
        boxShadow: SHADOW[level],
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
