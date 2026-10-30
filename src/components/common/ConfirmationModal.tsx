import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#E1E7E0] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#E1E7E0] bg-[#FAFBF9]">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${isDestructive ? 'text-[#C65C48]' : 'text-[#245B4A]'}`} />
            <h3 className="font-semibold text-base text-[#202923]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-[#68746B] hover:text-[#202923] rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-[#4A554E] leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#E1E7E0] bg-[#FAFBF9]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-xs ${
              isDestructive 
                ? 'bg-[#C65C48] hover:bg-[#A63A26]' 
                : 'bg-[#245B4A] hover:bg-[#194738]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
