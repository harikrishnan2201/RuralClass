import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  level?: number;
  status?: 'Needs Attention' | 'Developing' | 'Strong' | 'Not Started' | 'In Progress' | 'Completed' | 'Draft' | 'Approved';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level,
  status,
  showIcon = true,
  className = ''
}) => {
  // Determine computed status if level is provided
  let effectiveStatus = status;
  if (level !== undefined && !status) {
    if (level < 50) effectiveStatus = 'Needs Attention';
    else if (level < 75) effectiveStatus = 'Developing';
    else effectiveStatus = 'Strong';
  }

  let bgClass = 'bg-[#E6EFE8] text-[#245B4A] border-[#C8DCCF]';
  let icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
  let label = effectiveStatus || 'Normal';

  if (effectiveStatus === 'Needs Attention' || (level !== undefined && level < 50)) {
    bgClass = 'bg-[#FDF2F0] text-[#A63A26] border-[#F5C9C0]';
    icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#C65C48]" />;
    label = level !== undefined ? `Needs Attention (${level}%)` : 'Needs Attention';
  } else if (effectiveStatus === 'Developing' || (level !== undefined && level < 75)) {
    bgClass = 'bg-[#FEF8ED] text-[#9A6208] border-[#F7E2B5]';
    icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />;
    label = level !== undefined ? `Developing (${level}%)` : 'Developing';
  } else if (effectiveStatus === 'Strong' || (level !== undefined && level >= 75)) {
    bgClass = 'bg-[#F0F7F2] text-[#1E563E] border-[#C3DEC9]';
    icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#245B4A]" />;
    label = level !== undefined ? `Strong (${level}%)` : 'Strong';
  } else if (effectiveStatus === 'Approved') {
    bgClass = 'bg-[#F0F7F2] text-[#1E563E] border-[#C3DEC9] font-medium';
    icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#245B4A]" />;
    label = 'Plan Approved';
  } else if (effectiveStatus === 'Draft') {
    bgClass = 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#6B7280]" />;
    label = 'Draft Plan';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border font-medium whitespace-nowrap ${bgClass} ${className}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
