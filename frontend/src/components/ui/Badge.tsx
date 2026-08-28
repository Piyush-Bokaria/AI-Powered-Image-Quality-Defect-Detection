import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors';

  const variants: Record<string, string> = {
    default: 'bg-white/5 text-zinc-300 border-white/10',
    success: 'bg-green-500/15 text-green-400 border-green-500/25',
    warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
