import type {
    YoutubeEngineResponse,
    YoutubeFormat,
    YoutubeProgressStep,
} from './types';

export interface YoutubeSaveOption {
    id: string;
    label: string;
    description: string;
    formatId: string;
    formatLabel: string;
    qualityLabel: string;
    deliveryLabel: string;
    recommended?: boolean;
}

export function getYoutubeErrorMessage(payload: any) {
    if (typeof payload?.error === 'string') {
        return payload.error;
    }

    if (payload?.error?.message) {
        return payload.error.message;
    }

    return 'Request failed';
}

export function parseSseEvent(rawEvent: string) {
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim();
            continue;
        }

        if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    try {
        return {
            event,
            data: JSON.parse(dataLines.join('\n')),
        };
    } catch {
        return null;
    }
}

export function mergeProgressStep(steps: YoutubeProgressStep[], nextStep: YoutubeProgressStep) {
    const existingIndex = steps.findIndex((step) => step.step === nextStep.step);

    if (existingIndex === -1) {
        return [...steps, nextStep];
    }

    const updated = [...steps];
    updated[existingIndex] = nextStep;
    return updated;
}

export function resolveProgressSteps(defaultSteps: YoutubeProgressStep[], steps: YoutubeProgressStep[]) {
    return defaultSteps.map((defaultStep) => {
        const actualStep = steps.find((step) => step.step === defaultStep.step);
        return actualStep || defaultStep;
    });
}

export function markProgressError(
    steps: YoutubeProgressStep[],
    defaultSteps: YoutubeProgressStep[],
    errorMessage: string
) {
    const baseSteps = resolveProgressSteps(defaultSteps, steps);
    const activeStep = [...baseSteps].reverse().find((step) => step.status === 'active');
    const stepToMark = activeStep || baseSteps[0];

    return baseSteps.map((step) =>
        step.step === stepToMark.step
            ? { ...step, status: 'error' as const, message: errorMessage }
            : step
    );
}

function formatNumber(value?: number | null) {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat().format(value);
}

export function formatBytes(value?: number | null) {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return 'N/A';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let current = value;
    let unitIndex = 0;

    while (current >= 1024 && unitIndex < units.length - 1) {
        current /= 1024;
        unitIndex += 1;
    }

    return `${current.toFixed(current >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getYoutubeFormatLabel(format: YoutubeFormat) {
    return (format.ext || 'unknown').toUpperCase();
}

export function getYoutubeQualityLabel(format: YoutubeFormat) {
    if (typeof format.height === 'number' && format.height > 0) {
        return `${format.height}p`;
    }

    if (format.resolution) {
        const match = format.resolution.match(/(\d{3,4})$/);
        if (match) {
            return `${match[1]}p`;
        }
    }

    if (format.format_note) {
        const qualityMatch = format.format_note.match(/(\d{3,4}p)/i);
        if (qualityMatch) {
            return qualityMatch[1].toLowerCase();
        }
    }

    return 'Unknown';
}

function formatTrackSummary(track: { ext?: string | null; name?: string | null; url?: string | null }) {
    return [track.ext, track.name, track.url].filter(Boolean).join(' / ');
}

export function buildYoutubeMarkdown(result: YoutubeEngineResponse | null, url: string) {
    if (!result) {
        return '';
    }

    const lines = ['# YouTube Extract', '', '## Request', '', `- URL: ${url}`];
    const info = result.info;
    const engine = result.engine;
    const preview = result.preview;

    lines.push(`- Engine: ${engine.service}`);
    lines.push(`- Player Client: ${engine.player_client_profile}`);
    lines.push(`- Socket Timeout: ${engine.socket_timeout}s`);

    if (engine.metadata_language) {
        lines.push(`- Metadata Language: ${engine.metadata_language}`);
    }

    lines.push('', '## Video', '');
    lines.push(`- Title: ${info.title || 'N/A'}`);
    lines.push(`- Webpage: ${info.webpage_url}`);
    lines.push(`- Extractor: ${info.extractor || 'N/A'}`);
    lines.push(`- Extractor Key: ${info.extractor_key || 'N/A'}`);
    lines.push(`- Channel: ${info.channel || info.uploader || 'N/A'}`);
    lines.push(`- Duration: ${info.duration_string || info.duration || 'N/A'}`);
    lines.push(`- Upload Date: ${info.upload_date || 'N/A'}`);
    lines.push(`- Release Date: ${info.release_date || 'N/A'}`);
    lines.push(`- Views: ${formatNumber(info.view_count)}`);
    lines.push(`- Likes: ${formatNumber(info.like_count)}`);
    lines.push(`- Comments: ${formatNumber(info.comment_count)}`);
    lines.push(`- Live Status: ${info.live_status || 'N/A'}`);
    lines.push(`- Availability: ${info.availability || 'N/A'}`);
    lines.push(`- Age Limit: ${info.age_limit ?? 'N/A'}`);
    lines.push(`- Thumbnail: ${info.thumbnail || 'N/A'}`);

    if (preview?.url) {
        lines.push('', '## Preview', '');
        lines.push(`- Format ID: ${preview.format_id || 'N/A'}`);
        lines.push(`- Container: ${preview.ext || 'N/A'}`);
        lines.push(`- Resolution: ${preview.resolution || 'N/A'}`);
        lines.push(`- MIME Type: ${preview.mime_type || 'N/A'}`);
        lines.push(`- Source URL: ${preview.url}`);
    }

    if (info.tags?.length) {
        lines.push('', '## Tags', '', ...info.tags.map((tag) => `- ${tag}`));
    }

    if (info.categories?.length) {
        lines.push('', '## Categories', '', ...info.categories.map((category) => `- ${category}`));
    }

    if (info.description) {
        lines.push('', '## Description', '', info.description);
    }

    if (result.formats?.length) {
        lines.push('', '## Formats', '');
        lines.push(
            ...result.formats.map((format) => {
                const parts = [
                    `format=${getYoutubeFormatLabel(format)}`,
                    `quality=${getYoutubeQualityLabel(format)}`,
                    format.resolution ? `resolution=${format.resolution}` : null,
                    format.format_note || 'n/a',
                    format.fps ? `fps=${format.fps}` : null,
                    format.vcodec ? `v=${format.vcodec}` : null,
                    format.acodec ? `a=${format.acodec}` : null,
                    format.protocol ? `protocol=${format.protocol}` : null,
                    format.filesize ? `size=${formatBytes(format.filesize)}` : null,
                    format.filesize_approx ? `approx=${formatBytes(format.filesize_approx)}` : null,
                ].filter(Boolean);

                return `- ${format.format_id || 'unknown'}: ${parts.join(' | ')}`;
            })
        );
    }

    const subtitleLanguages = Object.entries(result.subtitles?.subtitles || {});
    if (subtitleLanguages.length) {
        lines.push('', '## Subtitles', '');
        lines.push(
            ...subtitleLanguages.map(
                ([language, tracks]) => `- ${language}: ${tracks.map(formatTrackSummary).filter(Boolean).join(', ')}`
            )
        );
    }

    const automaticLanguages = Object.entries(result.subtitles?.automatic_captions || {});
    if (automaticLanguages.length) {
        lines.push('', '## Automatic Captions', '');
        lines.push(
            ...automaticLanguages.map(
                ([language, tracks]) => `- ${language}: ${tracks.map(formatTrackSummary).filter(Boolean).join(', ')}`
            )
        );
    }

    if (info.entries?.length) {
        lines.push('', '## Playlist Preview', '');
        lines.push(
            ...info.entries.map(
                (entry, index) => `${index + 1}. ${entry.title || 'Entry'}${entry.url ? ` (${entry.url})` : ''}`
            )
        );
    }

    return lines.join('\n');
}

function isProgressiveMp4(format: YoutubeFormat) {
    return format.ext === 'mp4' && format.vcodec && format.vcodec !== 'none' && format.acodec && format.acodec !== 'none';
}

function isSaveableYoutubeFormat(format: YoutubeFormat) {
    const formatId = String(format.format_id || '').toLowerCase();
    const formatNote = String(format.format_note || '').toUpperCase();
    const protocol = String(format.protocol || '').toLowerCase();

    if (!format.format_id) {
        return false;
    }

    if (formatId.includes('dashy')) {
        return false;
    }

    if (formatNote.includes('MISSING POT')) {
        return false;
    }

    if (protocol && !['https', 'http'].includes(protocol)) {
        return false;
    }

    return true;
}

function hasVideo(format: YoutubeFormat) {
    return Boolean(format.vcodec && format.vcodec !== 'none');
}

function hasAudio(format: YoutubeFormat) {
    return Boolean(format.acodec && format.acodec !== 'none');
}

function getYoutubeDeliveryLabel(format: YoutubeFormat) {
    const video = hasVideo(format);
    const audio = hasAudio(format);

    if (video && audio) {
        return 'Muxed';
    }

    if (video) {
        return 'Video Only';
    }

    if (audio) {
        return 'Audio Only';
    }

    return 'Stream';
}

function sortFormatsByQuality(a: YoutubeFormat, b: YoutubeFormat) {
    const score = (format: YoutubeFormat) => {
        const video = hasVideo(format) ? 1 : 0;
        const audio = hasAudio(format) ? 1 : 0;
        const progressiveMp4 = isProgressiveMp4(format) ? 1 : 0;
        const extPriority = format.ext === 'mp4' ? 2 : format.ext === 'm4a' || format.ext === 'mp3' ? 1 : 0;

        return [
            progressiveMp4,
            video + audio,
            video,
            audio,
            extPriority,
            format.height || 0,
            format.fps || 0,
            format.filesize || format.filesize_approx || 0,
        ] as const;
    };

    const left = score(a);
    const right = score(b);
    for (let index = 0; index < left.length; index += 1) {
        if (right[index] !== left[index]) {
            return right[index] - left[index];
        }
    }
    return 0;
}

export function getDefaultYoutubeExtractSteps(): YoutubeProgressStep[] {
    return [
        { step: 1, total: 4, message: 'Cleaning previous temporary video', status: 'pending' },
        { step: 2, total: 4, message: 'Sending extract request to yt-engine', status: 'pending' },
        { step: 3, total: 4, message: 'Extracting metadata, formats, and subtitles', status: 'pending' },
        { step: 4, total: 4, message: 'Building extract result', status: 'pending' },
    ];
}

export function getDefaultYoutubeSaveSteps(): YoutubeProgressStep[] {
    return [
        { step: 1, total: 4, message: 'Cleaning previous temporary video', status: 'pending' },
        { step: 2, total: 4, message: 'Preparing selected extracted format', status: 'pending' },
        { step: 3, total: 4, message: 'Downloading media and building zip', status: 'pending' },
        { step: 4, total: 4, message: 'Handing zip back to the browser', status: 'pending' },
    ];
}

export function buildYoutubeSaveOptions(result: YoutubeEngineResponse | null): YoutubeSaveOption[] {
    if (!result) {
        return [];
    }

    const extractedFormats = [...(result.formats || [])]
        .filter((format) => isSaveableYoutubeFormat(format) && hasVideo(format))
        .sort(sortFormatsByQuality);

    if (extractedFormats.length === 0) {
        return [];
    }

    return extractedFormats.map((format, index) => ({
            id: `format-${format.format_id}`,
            label: `${getYoutubeFormatLabel(format)} • ${getYoutubeQualityLabel(format)}`,
            description: [
                hasAudio(format) ? getYoutubeDeliveryLabel(format) : 'Video + best audio on save',
                format.format_note,
                format.fps ? `${format.fps} fps` : null,
                format.filesize ? formatBytes(format.filesize) : format.filesize_approx ? `~${formatBytes(format.filesize_approx)}` : null,
            ].filter(Boolean).join(' • '),
            formatId: format.format_id!,
            formatLabel: getYoutubeFormatLabel(format),
            qualityLabel: getYoutubeQualityLabel(format),
            deliveryLabel: hasAudio(format) ? getYoutubeDeliveryLabel(format) : 'Video Merge',
            recommended: index === 0,
        }));
}

function getFileNameFromDisposition(contentDisposition: string | null) {
    if (!contentDisposition) {
        return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
        return quotedMatch[1];
    }

    const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
    if (plainMatch?.[1]) {
        return plainMatch[1].trim();
    }

    return null;
}

export async function triggerBrowserDownload(url: string, fileName?: string) {
    const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getYoutubeErrorMessage(payload));
    }

    const blob = await response.blob();
    const resolvedFileName = fileName || getFileNameFromDisposition(response.headers.get('content-disposition')) || 'youtube-download.zip';
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = resolvedFileName;
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
