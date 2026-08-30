import React from 'react';

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  const inputId = id || `cb-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 cursor-pointer select-none group ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
    >
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 mt-0.5 text-red-600 rounded border-slate-300 focus:ring-red-500 focus:ring-offset-0 transition-colors"
        {...props}
      />
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 leading-tight">
              {label}
            </p>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}

export default Checkbox;
