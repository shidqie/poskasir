import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 border-t border-slate-100 text-xs ${className}`}
    >
      <p className="text-slate-500 font-medium">
        Halaman <span className="font-bold text-slate-900">{currentPage}</span>{' '}
        dari <span className="font-bold text-slate-900">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={idx} className="px-2 py-1 text-slate-400">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg font-bold transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman Selanjutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
