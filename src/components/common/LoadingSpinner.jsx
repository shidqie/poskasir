import React from 'react';

export function LoadingSpinner({ size = 'md', className = '', message = null }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-red-200 border-t-red-600 animate-spin`}
        role="status"
        aria-label="Memuat..."
      />
      {message && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
