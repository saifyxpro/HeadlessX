'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowDown01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; suffix?: string }[];
    placeholder?: string;
    icon?: any;
}

export function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);
    const selectedIndex = useMemo(
        () => options.findIndex((option) => option.value === value),
        [options, value]
    );
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const typeaheadBufferRef = useRef('');
    const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const focusOptionAtIndex = (index: number) => {
        const option = optionRefs.current[index];
        if (!option) {
            return;
        }

        option.focus();
        option.scrollIntoView({ block: 'nearest' });
    };

    const resetTypeaheadTimeout = () => {
        if (typeaheadTimeoutRef.current) {
            clearTimeout(typeaheadTimeoutRef.current);
        }

        typeaheadTimeoutRef.current = setTimeout(() => {
            typeaheadBufferRef.current = '';
        }, 700);
    };

    const handleTypeahead = (rawKey: string) => {
        const key = rawKey.toLowerCase();
        if (!/^[a-z0-9]$/.test(key) || options.length === 0) {
            return;
        }

        typeaheadBufferRef.current += key;
        resetTypeaheadTimeout();

        const searchValue = typeaheadBufferRef.current;
        const startIndex = selectedIndex >= 0 ? selectedIndex + 1 : 0;
        const orderedOptions = [...options.slice(startIndex), ...options.slice(0, startIndex)];

        const match =
            orderedOptions.find((option) => option.label.toLowerCase().startsWith(searchValue)) ??
            orderedOptions.find((option) => option.label.toLowerCase().startsWith(key));

        if (!match) {
            return;
        }

        const matchIndex = options.findIndex((option) => option.value === match.value);
        onChange(match.value);

        if (isOpen) {
            requestAnimationFrame(() => focusOptionAtIndex(matchIndex));
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            requestAnimationFrame(() =>
                                focusOptionAtIndex(selectedIndex >= 0 ? selectedIndex : 0)
                            );
                        }
                        return;
                    }

                    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                        if (!isOpen) {
                            setIsOpen(true);
                        }
                        handleTypeahead(event.key);
                    }
                }}
                className={cn(
                    'ui-field flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-shadow focus:border-primary',
                    isOpen && 'border-primary ring-2 ring-primary/20 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)]',
                    !selectedOption && 'text-muted-foreground'
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && <HugeiconsIcon icon={Icon} size={16} className="shrink-0 text-slate-400" />}
                    <span className={cn('truncate', selectedOption ? 'font-medium text-slate-900' : 'text-slate-400')}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.suffix && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                            {selectedOption.suffix}
                        </span>
                    )}
                </div>
                <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={16}
                    className={cn('text-slate-400', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                    <div
                        className="ui-panel absolute left-0 right-0 z-[60] mt-2 max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 pr-1 shadow-[0_22px_50px_-24px_rgba(15,23,42,0.38)] [scrollbar-color:rgba(148,163,184,0.9)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                setIsOpen(false);
                                return;
                            }

                            if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                handleTypeahead(event.key);
                            }
                        }}
                    >
                        {options.map((opt, index) => (
                            <button
                                key={opt.value}
                                ref={(element) => {
                                    optionRefs.current[index] = element;
                                }}
                                type="button"
                                title={opt.label}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                onMouseDown={() => {
                                    typeaheadBufferRef.current = '';
                                }}
                                className={cn(
                                    'ui-row flex w-full items-center justify-between px-3 py-2 text-left text-sm group',
                                    value === opt.value ? 'bg-primary/5 font-medium text-primary' : 'text-slate-700'
                                )}
                            >
                                <span className="truncate pr-3">{opt.label}</span>
                                <div className="flex items-center gap-2">
                                    {opt.suffix && (
                                        <span className="text-xs text-slate-400 group-hover:text-slate-600">{opt.suffix}</span>
                                    )}
                                    {value === opt.value && (
                                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-primary" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
