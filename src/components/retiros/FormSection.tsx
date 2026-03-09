'use client';

import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FormSectionProps {
  title: string;
  sectionNumber: number;
  totalSections: number;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
  children: React.ReactNode;
}

export function FormSection({
  title,
  sectionNumber,
  totalSections,
  isOpen,
  onToggle,
  isComplete,
  children,
}: FormSectionProps) {
  return (
    <div className="border border-brand-brown/20 rounded-lg overflow-hidden">
      {/* Header - touch target 48px */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 min-h-[48px] transition-colors',
          isOpen ? 'bg-brand-cream' : 'bg-white hover:bg-brand-cream/50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Indicator */}
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
              isComplete
                ? 'bg-green-500 text-white'
                : isOpen
                  ? 'bg-brand-brown text-white'
                  : 'bg-brand-brown/20 text-brand-dark'
            )}
          >
            {isComplete ? <Check className="w-4 h-4" /> : sectionNumber}
          </div>
          <span className="font-medium text-brand-dark text-left">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-brand-brown transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-brand-brown/10">
        <div
          className="h-full bg-brand-brown transition-all duration-300"
          style={{ width: `${(sectionNumber / totalSections) * 100}%` }}
        />
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-white">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
