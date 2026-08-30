import React from 'react';
import { AlertCircle } from 'lucide-react';

export function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  className = '',
  textareaClassName = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-150 font-medium resize-none ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
            : 'border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
        } ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'text-slate-900'
        } focus:outline-none ${textareaClassName}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Textarea;
