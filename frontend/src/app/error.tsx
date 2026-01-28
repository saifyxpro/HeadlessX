'use client';

import { useEffect } from 'react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Page Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
            <div className="max-w-md bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 font-mono text-xs text-left text-red-600 overflow-auto w-full">
                {error.message || "Unknown error occurred"}
                {error.stack && <pre className="mt-2 opacity-70">{error.stack.split('\n')[0]}</pre>}
            </div>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
                Try again
            </button>
        </div>
    );
}
