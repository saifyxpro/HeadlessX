"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, useEffect } from "react";

interface StatusButtonProps {
    onClick?: () => void;
    status?: "idle" | "loading" | "success";
    textMap?: {
        idle: string;
        loading: string;
        success: string;
    };
    className?: string;
    disabled?: boolean;
}

export function StatusButton({
    onClick,
    status: controlledStatus,
    textMap = { idle: "Save", loading: "Saving", success: "Saved" },
    className,
    disabled = false,
    variant = "default",
    size = "default",
    showBadge = true
}: StatusButtonProps & { variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", size?: "default" | "sm" | "lg" | "icon", showBadge?: boolean }) {
    const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "success">("idle");

    const status = controlledStatus || internalStatus;

    // If uncontrolled and clicked, simplify demo logic (or rely on parent to pass status)
    const handleClick = () => {
        if (onClick) onClick();
        if (!controlledStatus) {
            setInternalStatus("loading");
        }
    };

    useEffect(() => {
        if (controlledStatus) return;

        let timer: NodeJS.Timeout;
        if (internalStatus === 'loading') {
            timer = setTimeout(() => setInternalStatus('success'), 2500);
        } else if (internalStatus === 'success') {
            timer = setTimeout(() => setInternalStatus('idle'), 2000);
        }

        return () => clearTimeout(timer);
    }, [internalStatus, controlledStatus]);

    const text = useMemo(() => {
        switch (status) {
            case "idle":
                return textMap.idle;
            case "loading":
                return textMap.loading;
            case "success":
                return textMap.success;
        }
    }, [status, textMap]);

    return (
        <div className="relative inline-flex group font-sans">
            <Button
                onClick={handleClick}
                className={cn(
                    "relative transition-all duration-300 disabled:opacity-100",
                    status === "idle"
                        ? "transition-colors"
                        : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border-muted shadow-sm",
                    className
                )}
                variant={variant}
                size={size}
                disabled={status !== "idle" || disabled}
            >
                <span className="flex items-center justify-center gap-2">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {status === 'idle' ? (
                            <motion.span
                                key="text"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                            >
                                {text}
                            </motion.span>
                        ) : (
                            <motion.span
                                key="status-text"
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="inline-flex items-center gap-2"
                            >
                                {text}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </span>
            </Button>

            {/* Status Indicator Bubble - Only show if specifically needed or make it subtle? 
                For general reusable buttons, the text change is often enough. 
                But let's keep it if it fits, or maybe adjust position. 
                Actually, the bubbles were overflowing. Let's make them contained or remove them for small buttons?
                I'll keep them but adjust positioning to be less intrusive.
            */}
            <div className={cn("absolute -top-1 -right-1 z-10 pointer-events-none")}>
                <AnimatePresence mode="wait">
                    {showBadge && status !== "idle" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className={cn(
                                "flex items-center justify-center size-5 rounded-full ring-2 overflow-hidden shadow-sm",
                                status === "success"
                                    ? "bg-emerald-500 text-white ring-white"
                                    : "bg-slate-100 text-slate-400 ring-white"
                            )}
                        >
                            <AnimatePresence mode="popLayout">
                                {status === "loading" && (
                                    <motion.div
                                        key="loader"
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                    </motion.div>
                                )}
                                {status === "success" && (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center justify-center"
                                    >
                                        <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
