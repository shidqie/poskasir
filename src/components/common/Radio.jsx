import React from 'react';

export function Radio({
  id,
  name,
  label,
  description,
  value,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  const inputId = id || `radio-${name}-${value}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 cursor-pointer select-none group ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
    >
      <input
        type="radio"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 mt-0.5 text-red-600 border-slate-300 focus:ring-red-500 focus:ring-offset-0 transition-colors"
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

export default Radio;
