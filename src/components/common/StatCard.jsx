import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-slate-400',
  icon: Icon,
  iconVariant = 'dark', // 'primary' (red) | 'dark' (slate-900)
  cardVariant = 'default', // 'primary' (light red tint) | 'default' (white)
  className = '',
}) {
  const isPrimaryIcon = iconVariant === 'primary';
  const isPrimaryCard = cardVariant === 'primary';

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 flex items-center gap-4 hover:shadow-md ${
        isPrimaryCard
          ? 'bg-red-50/40 border-red-200/80 shadow-xs hover:border-red-300'
          : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
      } ${className}`}
    >
      {/* Left Icon Squircle */}
      {Icon && (
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
            isPrimaryIcon
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
          }`}
        >
          <Icon className="w-6 h-6 stroke-[2.2]" />
        </div>
      )}

      {/* Right Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight truncate">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight truncate">
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs font-semibold mt-1 truncate ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
