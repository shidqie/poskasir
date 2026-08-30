import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Package,
  title = 'Belum Ada Data',
  description = 'Data tidak ditemukan atau belum pernah ditambahkan.',
  actionLabel = null,
  onAction = null,
  actionIcon = Plus,
  className = '',
}) {
  return (
    <div
      className={`py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mb-3 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" icon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
