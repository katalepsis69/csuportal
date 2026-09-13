'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Entrance stagger for dashboard cards/panels — 300–450ms, ease-out,
 * 60ms per item. Renders the final state immediately under reduced motion
 * (MASTER.md motion contract).
 */
export default function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  );
}
