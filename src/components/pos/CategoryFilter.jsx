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
        className={`px-3.5 py-1.5 rounded-lg shrink-0 transition-all ${
          selectedCategoryId === ''
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
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
            className={`px-3.5 py-1.5 rounded-lg shrink-0 transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
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
