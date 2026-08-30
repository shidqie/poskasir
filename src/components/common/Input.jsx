import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input(
  {
    label,
    id,
    type = 'text',
    error,
    helperText,
    icon: Icon,
    rightElement,
    className = '',
    containerClassName = '',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className={`w-full space-y-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`block w-full rounded-xl border text-xs sm:text-sm font-medium transition-all bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : 'pl-3.5'
          } ${rightElement ? 'pr-24' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-400 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'
          } ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
