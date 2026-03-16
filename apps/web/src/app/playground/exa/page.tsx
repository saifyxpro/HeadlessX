import { ExaWorkbench } from '@/components/playground/exa';

function hasExaApiKey() {
    return Boolean(
        process.env.EXA_API_KEY?.trim() ||
        process.env.NEXT_PUBLIC_EXA_API_KEY?.trim()
    );
}

export default function ExaPage() {
    return <ExaWorkbench available={hasExaApiKey()} />;
}
