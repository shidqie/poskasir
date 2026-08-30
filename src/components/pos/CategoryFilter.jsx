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
            ? 'bg-slate-900 text-white font-bold shadow-xs'
            : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/90 hover:text-slate-900'
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
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/90 hover:text-slate-900'
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
