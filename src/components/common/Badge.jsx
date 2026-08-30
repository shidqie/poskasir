import React from 'react';

export function Badge({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
}) {
  const variantStyles = {
    primary: 'bg-red-50 text-red-700 border-red-200 dot-bg-red-500',
    secondary: 'bg-slate-900 text-slate-100 border-slate-800 dot-bg-red-500',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-bg-emerald-500',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dot-bg-amber-500',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dot-bg-rose-500',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dot-bg-slate-400',
  };

  const dotColors = {
    primary: 'bg-red-500',
    secondary: 'bg-red-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-red-500'} shrink-0`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
