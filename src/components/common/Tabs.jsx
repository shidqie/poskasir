import React from 'react';

export function Tabs({
  tabs = [], // [{ id, label, icon: Icon, count }]
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-white text-red-600 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
