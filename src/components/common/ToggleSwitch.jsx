import React from 'react';

export function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) {
  const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-bold text-slate-900 cursor-pointer block leading-tight"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <label
        htmlFor={inputId}
        className={`relative inline-flex items-center cursor-pointer shrink-0 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => !disabled && onChange && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
      </label>
    </div>
  );
}

export default ToggleSwitch;
