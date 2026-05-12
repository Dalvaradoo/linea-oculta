'use client';

// Adapted from cult-ui animated-number
// https://github.com/nolly-studio/cult-ui

import React, { useEffect } from 'react';
import { motion, MotionValue, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  precision?: number;
  format?: (value: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({
  value,
  precision = 1,
  format,
  className,
  style,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });

  const display: MotionValue<string> = useTransform(spring, (current) => {
    const n = parseFloat(current.toFixed(precision));
    return format ? format(n) : n.toFixed(precision);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className} style={style}>{display}</motion.span>;
}
