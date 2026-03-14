import { useState } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { HugeiconType } from '../types';

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    icon?: HugeiconType;
}

export function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon,
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 text-left text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 hover:bg-white ${Icon ? 'pl-11 pr-10' : 'px-4'}`}
            >
                {Icon && (
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <HugeiconsIcon icon={Icon} className="h-4.5 w-4.5" />
                    </div>
                )}
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 z-[9999] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {options.map((option) => {
                            const isSelected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                                        isSelected ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
