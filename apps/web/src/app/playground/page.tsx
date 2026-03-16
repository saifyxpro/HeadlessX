import { PlaygroundClient } from '@/components/playground/PlaygroundClient';

function hasExaApiKey() {
    return Boolean(
        process.env.EXA_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_EXA_API_KEY?.trim()
    );
}

function hasTavilyApiKey() {
    return Boolean(
        process.env.TAVILY_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_TAVILY_API_KEY?.trim()
    );
}

export default function PlaygroundPage() {
    return <PlaygroundClient exaAvailable={hasExaApiKey()} tavilyAvailable={hasTavilyApiKey()} />;
}
