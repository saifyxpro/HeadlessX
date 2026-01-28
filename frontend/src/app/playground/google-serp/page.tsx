
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleSerpHeader } from '@/components/playground/google-serp/GoogleSerpHeader';
import { ConfigurationPanel } from '@/components/playground/google-serp/ConfigurationPanel';
import { ResultsPanel } from '@/components/playground/google-serp/ResultsPanel';
import { SearchResponse, Profile, ProgressStep } from '@/components/playground/google-serp/types';

const fetchProfiles = async () => {
    // Dashboard API key from environment or fallback
    const DASHBOARD_API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || 'dashboard-internal';
    const res = await fetch('/api/profiles', {
        headers: { 'x-api-key': DASHBOARD_API_KEY }
    });
    return res.json();
};

const INITIAL_STEPS: ProgressStep[] = [];

export default function GoogleSerpPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [data, setData] = useState<SearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [timeout, setTimeout] = useState<number>(60);
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch profiles
    const { data: profilesData } = useQuery({
        queryKey: ['profiles'],
        queryFn: fetchProfiles,
        refetchInterval: 5000,
    });
    const profiles: Profile[] = profilesData?.profiles || [];

    // Timer Logic
    useEffect(() => {
        if (isLoading) {
            const currentStartTime = Date.now();
            setStartTime(currentStartTime);
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(Date.now() - currentStartTime);
            }, 100);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (data && startTime) {
                setElapsedTime(Date.now() - startTime);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isLoading, data]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setIsStreaming(true);
        setError(null);
        setData(null);
        setSteps([]);

        try {
            const encodedQuery = encodeURIComponent(query);
            const encodedProfileId = selectedProfileId ? `&profileId=${encodeURIComponent(selectedProfileId)}` : '';
            // Use direct backend URL to avoid Next.js proxy buffering SSE
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const streamUrl = `${apiUrl}/api/google-serp/stream?query=${encodedQuery}${encodedProfileId}&timeout=${timeout}`;

            // Use fetch + ReadableStream instead of EventSource for better SSE handling
            const response = await fetch(streamUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'x-api-key': 'test-key-dashboard', // Dashboard API key
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const jsonStr = line.slice(5).trim();
                            if (!jsonStr || jsonStr === '{}') continue;

                            const data = JSON.parse(jsonStr);
                            console.log('📊 SSE Data:', data);

                            // Progress update (has status field like website scraper)
                            if (data.status && data.step !== undefined) {
                                setSteps(prev => {
                                    const newSteps = [...prev];
                                    const idx = data.step - 1;
                                    newSteps[idx] = {
                                        step: data.step,
                                        total: data.total,
                                        message: data.message,
                                        status: data.status as 'active' | 'completed' | 'pending' | 'error'
                                    };
                                    return newSteps.sort((a, b) => a.step - b.step);
                                });
                            }
                            // Result (has success and data fields)
                            if (data.success && data.data) {
                                setData(data.data);
                                setIsLoading(false);
                                setIsStreaming(false);
                            }
                            // Error
                            if (data.error) {
                                setError(data.error);
                                setIsLoading(false);
                                setIsStreaming(false);
                            }
                        } catch (parseErr) {
                            console.error('SSE parse error:', parseErr, 'Line:', line);
                        }
                    }
                }
            }

            setIsLoading(false);
            setIsStreaming(false);
        } catch (err: any) {
            console.error('Stream error:', err);
            setError(err.message || 'Connection failed');
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    return (
        <div className="relative min-h-screen p-8 lg:p-12 overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 bg-[#f8fafc]">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob" />
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-[80px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
            </div>

            <div className="max-w-[1600px] mx-auto z-10 relative">
                <GoogleSerpHeader
                    elapsedTime={elapsedTime}
                    isLoading={isLoading}
                    hasResult={!!data}
                    error={error}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <ConfigurationPanel
                        query={query}
                        setQuery={setQuery}
                        selectedProfileId={selectedProfileId}
                        setSelectedProfileId={setSelectedProfileId}
                        timeout={timeout}
                        setTimeout={setTimeout}
                        profiles={profiles}
                        onSearch={handleSearch}
                        isLoading={isLoading}
                    />

                    <ResultsPanel
                        data={data}
                        isStreaming={isStreaming}
                        isPending={isLoading && !isStreaming}
                        error={error}
                        steps={steps}
                        elapsedTime={elapsedTime}
                        onRetry={handleSearch}
                    />
                </div>
            </div>
        </div>
    );
}
