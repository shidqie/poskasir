import React from 'react';

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
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
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
          className={`block w-full rounded-lg border pl-11 pr-3.5 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
          } ${className}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

export default CurrencyInput;
