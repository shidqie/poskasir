import React from 'react';

export function Avatar({
  name = 'User',
  src = null,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  role = null,
  className = '',
}) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size] || sizeMap.md} rounded-xl object-cover border border-slate-200 shadow-xs`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-xl bg-red-50 text-red-600 border border-red-200/80 flex items-center justify-center font-black shadow-xs select-none`}
        >
          {initial}
        </div>
      )}
      {role && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
          title={`Role: ${role}`}
        />
      )}
    </div>
  );
}

export default Avatar;
