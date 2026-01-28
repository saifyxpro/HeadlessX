"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    Cancel01Icon,
    Add01Icon,
    Key01Icon,
} from "@hugeicons/core-free-icons";

export interface StackedListItem {
    id: string;
    title: string;
    subtitle?: string;
    status: string;
    avatar?: string;
    icon?: any; // Icon component
    meta?: React.ReactNode;
    active?: boolean;
}

interface StackedListProps {
    items: StackedListItem[];
    title?: string;
    onSearch?: (query: string) => void;
    onAdd?: () => void;
    renderItemActions?: (item: StackedListItem) => React.ReactNode;
}

const sweepSpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 0.5,
};

const MemberItem = ({ member, actions }: { member: StackedListItem, actions?: React.ReactNode }) => {
    const getIconStyles = (status: string) => {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus === 'error' || lowerStatus.startsWith('4') || lowerStatus.startsWith('5')) return "bg-red-50 text-red-600 border-red-100";
        if (lowerStatus === 'success' || lowerStatus === '200') return "bg-emerald-50 text-emerald-600 border-emerald-100";
        if (lowerStatus === 'warning' || lowerStatus.startsWith('3')) return "bg-amber-50 text-amber-600 border-amber-100";
        if (lowerStatus === 'pending' || lowerStatus === '0') return "bg-slate-50 text-slate-600 border-slate-100";
        return "bg-indigo-50 text-indigo-600 border-indigo-100"; // Default
    };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, x: 10, y: 15, rotate: 1 },
                visible: { opacity: 1, x: 0, y: 0, rotate: 0 },
            }}
            transition={sweepSpring}
            style={{ originX: 1, originY: 1 }}
            className="flex items-center group py-4 px-4 -mx-4 rounded-xl hover:bg-white/60 transition-colors border-b border-transparent hover:border-white/20"
        >
            <div className="relative mr-4 shrink-0">
                {member.avatar ? (
                    <img
                        src={member.avatar}
                        alt={member.title}
                        className="w-12 h-12 rounded-2xl ring-2 ring-white shadow-sm object-cover"
                    />
                ) : (
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-colors", getIconStyles(member.status))}>
                        <HugeiconsIcon icon={member.icon || Key01Icon} size={24} />
                    </div>
                )}

                {member.active && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm z-10">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight leading-none mb-1.5 truncate">
                    {member.title}
                </h3>
                <div className="flex items-center gap-1.5 opacity-80">
                    {member.active && (
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                    <p className="text-sm font-medium leading-none text-slate-500">
                        {member.subtitle}
                    </p>
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
                <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-lg border",
                    (() => {
                        const s = member.status?.toLowerCase() || '';
                        if (s === 'success' || s === '200') return "bg-emerald-50 text-emerald-700 border-emerald-100";
                        if (s === 'error' || s.startsWith('4') || s.startsWith('5')) return "bg-red-50 text-red-700 border-red-100";
                        if (s === 'pending' || s === '0') return "bg-slate-100 text-slate-600 border-slate-200";
                        if (s === 'warning') return "bg-amber-50 text-amber-700 border-amber-100";
                        return "bg-indigo-50 text-indigo-700 border-indigo-100";
                    })()
                )}>
                    {member.status === '0' ? 'Pending' : member.status}
                </span>
                {actions}
            </div>
        </motion.div>
    );
};

export default function StackedList({ items, title = "Items", onSearch, onAdd, renderItemActions }: StackedListProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = useMemo(
        () => {
            if (onSearch) {
                // If external search handler provided, assume items are already filtered or handled externally
                // But typically onSearch is a callback.
                // let's just do local filtering if items are passed.
            }
            return items.filter(
                (m) =>
                    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.subtitle && m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        },
        [searchQuery, items]
    );

    // Effect to notify parent of search change
    useMemo(() => {
        if (onSearch) onSearch(searchQuery);
    }, [searchQuery, onSearch]);

    // Only show first 5 if not expanded, or filtered list if expanded
    const displayItems = isExpanded ? filteredItems : items.slice(0, 5);

    return (
        <div className="flex items-center justify-center w-full bg-transparent font-sans not-prose">
            <div className={cn(
                "relative w-full bg-white/60 backdrop-blur-2xl rounded-[32px] border border-white/50 flex flex-col overflow-hidden shadow-premium transition-all duration-500",
                isExpanded ? "min-h-[600px]" : "h-auto"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-8 pb-3">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                                {title}
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 mt-0.5 rounded-full leading-none font-medium border border-slate-200">
                                    {items.length}
                                </span>
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-9 w-9 rounded-full border-slate-200 bg-white/50 text-slate-500 hover:bg-white hover:text-slate-900 shadow-sm"
                                >
                                    {isExpanded ? (
                                        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
                                    ) : (
                                        <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2.5} />
                                    )}
                                </Button>
                                {onAdd && (
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={onAdd}
                                        className="h-9 w-9 rounded-full shadow-lg hover:shadow-xl transition-all shadow-primary/20"
                                    >
                                        <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2.5} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="relative overflow-hidden"
                                >
                                    <HugeiconsIcon
                                        icon={Search01Icon}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                                        size={16}
                                    />
                                    <Input
                                        placeholder={`Search ${title.toLowerCase()}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-11 pl-11 pr-4 bg-white/50 border-white/40 focus-visible:ring-primary/20 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 transition-all w-full shadow-inner"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar scroll-visible">
                        <motion.div
                            initial={false}
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                            className="space-y-1"
                        >
                            <AnimatePresence mode="popLayout">
                                {displayItems.length > 0 ? (
                                    displayItems.map((item) => (
                                        <MemberItem key={item.id} member={item} actions={renderItemActions ? renderItemActions(item) : undefined} />
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        No items found
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {!isExpanded && items.length > 5 && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsExpanded(true)}
                                className="w-full py-3 mt-4 text-sm font-medium text-slate-500 hover:text-slate-800 bg-white/40 hover:bg-white/80 rounded-2xl transition-all border border-dashed border-slate-200 hover:border-slate-300 shadow-sm"
                            >
                                View all {items.length} items
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
