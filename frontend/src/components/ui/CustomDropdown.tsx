'use client';

import { useState } from 'react';
import { ArrowDown01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils'; // Assuming cn exists

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; suffix?: string }[];
    placeholder?: string;
    icon?: any; // Allow Hugeicons component type
}

export function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between h-10 px-3 py-2 text-sm border border-border/60 rounded-xl bg-white/50 backdrop-blur-sm transition-all shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    isOpen && "border-primary ring-2 ring-primary/20",
                    !selectedOption && "text-muted-foreground"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && <HugeiconsIcon icon={Icon} size={16} className="text-slate-400 shrink-0" />}
                    <span className={cn("truncate", selectedOption ? "text-slate-900 font-medium" : "text-slate-400")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.suffix && (
                        <span className="text-emerald-600 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">{selectedOption.suffix}</span>
                    )}
                </div>
                <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={16}
                    className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 z-[60] mt-2 py-1 bg-white border border-border/60 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between group",
                                    value === opt.value ? "bg-primary/5 text-primary font-medium" : "text-slate-700"
                                )}
                            >
                                <span>{opt.label}</span>
                                <div className="flex items-center gap-2">
                                    {opt.suffix && <span className="text-slate-400 text-xs group-hover:text-slate-600">{opt.suffix}</span>}
                                    {value === opt.value && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-primary" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
