import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants: Record<string, string> = {
      default:
        'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/25 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]',
      ghost: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
      outline:
        'border border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20',
    };

    const sizes: Record<string, string> = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
