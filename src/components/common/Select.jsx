import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  placeholder = '-- Pilih Opsi --',
  className = '',
  selectClassName = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={inputId}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none pl-3.5 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl transition-all font-medium ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20'
          } ${
            disabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
              : 'text-slate-900 cursor-pointer'
          } focus:outline-none ${selectClassName}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={idx} value={val} className="py-1.5 text-slate-900 bg-white">
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
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
}

export default Select;
