import React from 'react';

/**
 * Reusable glassmorphism card container.
 */
export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'p-5',
  as: Component = 'div',
  onClick,
  ...props
}) {
  const classes = [
    'glass',
    hover && 'glass-hover cursor-pointer',
    glow && 'animate-pulse-glow',
    padding,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} onClick={onClick} {...props}>
      {children}
    </Component>
  );
}
