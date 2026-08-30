import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs({
  items = [], // [{ label, to }]
  className = '',
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-500 font-medium ${className}`}
    >
      <Link
        to="/"
        className="hover:text-red-600 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast || !item.to ? (
              <span className="font-bold text-slate-900 truncate">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-red-600 transition-colors truncate"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
