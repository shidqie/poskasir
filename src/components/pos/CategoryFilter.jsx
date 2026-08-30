import React from 'react';

export function CategoryFilter({
  categories = [],
  selectedCategoryId = '',
  onSelectCategory,
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold select-none">
      <button
        type="button"
        onClick={() => onSelectCategory('')}
        className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer ${
          selectedCategoryId === ''
            ? 'bg-red-600 text-white shadow-xs font-bold'
            : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
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
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer ${
              isSelected
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
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
