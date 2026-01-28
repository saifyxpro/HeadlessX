'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold mb-4">Something went drastically wrong!</h2>
                    <p className="mb-4 text-red-500">{error.message}</p>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
