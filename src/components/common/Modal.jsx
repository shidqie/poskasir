import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
  isBottomSheet = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box Container: Bottom Sheet on Mobile (<640px), Centered Modal on Desktop (>=640px) */}
      <div className={`flex min-h-full ${isBottomSheet ? 'items-end sm:items-center justify-center p-0 sm:p-4 text-center' : 'items-center justify-center p-4 text-center'}`}>
        <div
          className={`w-full ${maxWidth} transform bg-white text-left align-middle shadow-2xl transition-all border border-slate-200/80 ${
            isBottomSheet
              ? 'rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col my-0 sm:my-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200'
              : 'rounded-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200'
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-headline' : undefined}
        >
          {/* Mobile Bottom Sheet Pull Indicator */}
          {isBottomSheet && (
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 pr-2">
                {title && (
                  <h3
                    id="modal-headline"
                    className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate"
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed truncate sm:whitespace-normal">{subtitle}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body with inner scroll for mobile */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
