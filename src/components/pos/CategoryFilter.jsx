import React from 'react';

export function CategoryFilter({
  categories = [],
  selectedCategoryId = '',
  onSelectCategory,
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs sm:text-sm font-semibold select-none">
      <button
        type="button"
        onClick={() => onSelectCategory('')}
        className={`px-3.5 py-1.5 rounded-xl shrink-0 transition-all ${
          selectedCategoryId === ''
            ? 'bg-red-600 text-white shadow-xs shadow-red-500/25 font-bold'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
        }`}
      >
        Semua Kategori
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl shrink-0 transition-all ${
              isSelected
                ? 'bg-red-600 text-white shadow-xs shadow-red-500/25 font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
