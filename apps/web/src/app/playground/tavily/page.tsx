import { TavilyWorkbench } from '@/components/playground/tavily';

function hasTavilyApiKey() {
    return Boolean(
        process.env.TAVILY_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_TAVILY_API_KEY?.trim()
    );
}

export default function TavilyPage() {
    return <TavilyWorkbench available={hasTavilyApiKey()} />;
}
