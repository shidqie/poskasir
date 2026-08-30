import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2, HelpCircle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  isLoading = false,
}) {
  const typeIcons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    info: <Info className="w-6 h-6 text-red-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
  };

  const typeStyles = {
    warning: 'bg-amber-50 border-amber-100',
    danger: 'bg-rose-50 border-rose-100',
    info: 'bg-red-50 border-red-100',
    success: 'bg-emerald-50 border-emerald-100',
  };

  const confirmVariant = type === 'danger' ? 'danger' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showCloseButton={!isLoading}>
      <div className="text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div
            className={`p-3 rounded-2xl border ${
              typeStyles[type] || typeStyles.warning
            } shrink-0`}
          >
            {typeIcons[type] || <HelpCircle className="w-6 h-6 text-slate-500" />}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-900">{title}</h4>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
