import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-slate-400',
  icon: Icon,
  iconVariant = 'dark',
  cardVariant = 'default',
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white transition-all duration-150 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 stroke-[2]" />
          </div>
        )}
      </div>

      <div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
          {value}
        </p>
        {subtitle && (
          <p className={`text-[11px] mt-1 font-medium truncate ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
