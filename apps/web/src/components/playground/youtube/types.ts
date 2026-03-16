export interface YoutubeFormat {
    format_id?: string | null;
    ext?: string | null;
    format_note?: string | null;
    resolution?: string | null;
    width?: number | null;
    height?: number | null;
    vcodec?: string | null;
    acodec?: string | null;
    fps?: number | null;
    filesize?: number | null;
    filesize_approx?: number | null;
    protocol?: string | null;
    dynamic_range?: string | null;
}

export interface YoutubeSubtitleTrack {
    ext?: string | null;
    url?: string | null;
    name?: string | null;
}

export interface YoutubePlaylistEntry {
    id?: string | null;
    title?: string | null;
    url?: string | null;
    duration?: number | null;
    channel?: string | null;
    availability?: string | null;
}

export interface YoutubeInfo {
    id?: string | null;
    extractor?: string | null;
    extractor_key?: string | null;
    webpage_url: string;
    original_url: string;
    title?: string | null;
    description?: string | null;
    duration?: number | null;
    view_count?: number | null;
    like_count?: number | null;
    comment_count?: number | null;
    live_status?: string | null;
    availability?: string | null;
    age_limit?: number | null;
    uploader?: string | null;
    channel?: string | null;
    channel_id?: string | null;
    uploader_id?: string | null;
    upload_date?: string | null;
    release_date?: string | null;
    thumbnail?: string | null;
    tags?: string[];
    categories?: string[];
    duration_string?: string | null;
    is_playlist?: boolean;
    playlist_count?: number | null;
    entries?: YoutubePlaylistEntry[];
}

export interface YoutubeSubtitleInventory {
    subtitles?: Record<string, YoutubeSubtitleTrack[]>;
    automatic_captions?: Record<string, YoutubeSubtitleTrack[]>;
}

export type YoutubePlayerClientProfile = 'mobile' | 'default';
export type YoutubeSaveQualityPreset = 'best' | '1080p' | '720p' | '480p';

export interface YoutubeEngineMetadata {
    service: string;
    player_client_profile: YoutubePlayerClientProfile;
    metadata_language?: string | null;
    socket_timeout: number;
}

export interface YoutubePreviewSource {
    url?: string | null;
    format_id?: string | null;
    ext?: string | null;
    resolution?: string | null;
    width?: number | null;
    height?: number | null;
    mime_type?: string | null;
    format_note?: string | null;
}

export interface YoutubeEngineResponse {
    engine: YoutubeEngineMetadata;
    info: YoutubeInfo;
    preview?: YoutubePreviewSource | null;
    formats: YoutubeFormat[];
    subtitles: YoutubeSubtitleInventory;
}

export interface YoutubeProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface YoutubeSavedDownload {
    job_id: string;
    download_name: string;
    media_file_name: string;
    metadata_file_name: string;
    resolved_format: string;
    size_bytes: number;
    available_until?: string | null;
}
