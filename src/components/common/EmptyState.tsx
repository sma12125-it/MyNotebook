import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  iconColor = 'text-[#7C9070]',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-[#E5E0D5] dark:border-[#2C3A2A] bg-[#FDFCF9]/60 dark:bg-[#1C241B]/40 my-4">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F2EB] dark:bg-[#253023] flex items-center justify-center mb-4 text-[#7C9070]">
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <h4 className="text-base font-bold text-[#2D3A29] dark:text-[#E5EFE2]">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-[#8A8A87] dark:text-[#9BA598] max-w-sm mt-1 mb-5">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C9070] hover:bg-[#6B7D60] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

