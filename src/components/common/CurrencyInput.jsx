import React from 'react';
import { AlertCircle } from 'lucide-react';

export function CurrencyInput({
  label,
  id,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = '0',
  className = '',
  containerClassName = '',
  name,
}) {
  const inputId = id || name;

  // Format internal display value with thousands separator
  const formatDisplay = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = String(val).replace(/\D/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    onChange(rawValue === '' ? '' : Number(rawValue));
  };

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
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs sm:text-sm">
          Rp
        </div>

        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={formatDisplay(value)}
          onChange={handleChange}
          className={`block w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold font-mono text-slate-900 transition-all bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-100 disabled:text-slate-400 ${
            error
              ? 'border-rose-400 text-rose-900 focus:border-rose-500'
              : 'border-slate-200 focus:border-red-500'
          } ${className}`}
        />
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

export default CurrencyInput;
