import { PlaygroundClient } from '@/components/playground/PlaygroundClient';

function hasTavilyApiKey() {
    return Boolean(
        process.env.TAVILY_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_TAVILY_API_KEY?.trim()
    );
}

export default function PlaygroundPage() {
    return <PlaygroundClient tavilyAvailable={hasTavilyApiKey()} />;
}
