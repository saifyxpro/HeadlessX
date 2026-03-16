type YoutubeInfoInput = {
    url: string;
    flatPlaylist?: boolean;
    includeFormats?: boolean;
    includeSubtitles?: boolean;
    playlistPreviewLimit?: number;
    playerClientProfile?: 'mobile' | 'default' | 'web' | 'tv';
    metadataLanguage?: string;
    socketTimeout?: number;
    cleanupJobId?: string;
};

type YoutubeSaveInput = {
    url: string;
    qualityPreset?: 'best' | '1080p' | '720p' | '480p';
    formatId?: string;
    playerClientProfile?: 'mobile' | 'default' | 'web' | 'tv';
    metadataLanguage?: string;
    socketTimeout?: number;
    cleanupJobId?: string;
};

class YoutubeEngineServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'YoutubeEngineServiceError';
        this.statusCode = statusCode;
    }
}

class YoutubeEngineService {
    public isConfigured() {
        return Boolean(process.env.YT_ENGINE_URL?.trim());
    }

    private getBaseUrl() {
        const value = process.env.YT_ENGINE_URL?.trim();
        if (!value) {
            throw new YoutubeEngineServiceError('YT_ENGINE_URL is not configured', 503);
        }
        return value.replace(/\/$/, '');
    }

    private getTimeoutMs() {
        const value = process.env.YT_ENGINE_TIMEOUT_MS?.trim();
        const parsed = value ? Number(value) : 45000;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 45000;
    }

    private buildExtractPayload(payload: YoutubeInfoInput) {
        return {
            url: payload.url,
            flat_playlist: payload.flatPlaylist ?? true,
            include_formats: payload.includeFormats ?? true,
            include_subtitles: payload.includeSubtitles ?? true,
            playlist_preview_limit: payload.playlistPreviewLimit ?? 10,
            player_client_profile: payload.playerClientProfile ?? 'mobile',
            metadata_language: payload.metadataLanguage?.trim() || null,
            socket_timeout: payload.socketTimeout ?? 30,
            cleanup_job_id: payload.cleanupJobId?.trim() || null,
        };
    }

    private buildSavePayload(payload: YoutubeSaveInput) {
        return {
            url: payload.url,
            quality_preset: payload.qualityPreset ?? 'best',
            format_id: payload.formatId?.trim() || null,
            player_client_profile: payload.playerClientProfile ?? 'mobile',
            metadata_language: payload.metadataLanguage?.trim() || null,
            socket_timeout: payload.socketTimeout ?? 30,
            cleanup_job_id: payload.cleanupJobId?.trim() || null,
        };
    }

    private async post(path: string, payload: Record<string, unknown>) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

        try {
            const response = await fetch(`${this.getBaseUrl()}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data?.error?.message || 'YouTube engine request failed';
                throw new YoutubeEngineServiceError(message, response.status);
            }

            return data;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new YoutubeEngineServiceError('YouTube engine request timed out', 504);
            }
            if (error instanceof YoutubeEngineServiceError) {
                throw error;
            }
            throw new YoutubeEngineServiceError(error instanceof Error ? error.message : 'YouTube engine request failed');
        } finally {
            clearTimeout(timeout);
        }
    }

    private async get(path: string) {
        const response = await fetch(`${this.getBaseUrl()}${path}`, { method: 'GET' });
        const data = await response.json();

        if (!response.ok) {
            const message = data?.error?.message || 'YouTube engine request failed';
            throw new YoutubeEngineServiceError(message, response.status);
        }

        return data;
    }

    public async getInfo(input: YoutubeInfoInput) {
        return this.post('/extract/info', this.buildExtractPayload(input));
    }

    public async getFormats(input: YoutubeInfoInput) {
        return this.post('/extract/formats', this.buildExtractPayload(input));
    }

    public async getSubtitles(input: YoutubeInfoInput) {
        return this.post('/extract/subtitles', this.buildExtractPayload(input));
    }

    public async getStatus() {
        return this.get('/health');
    }

    public async save(input: YoutubeSaveInput) {
        return this.post('/save/video', this.buildSavePayload(input));
    }

    public async download(jobId: string) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

        try {
            const response = await fetch(`${this.getBaseUrl()}/download/${jobId}`, {
                method: 'GET',
                signal: controller.signal,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                const message = data?.error?.message || 'YouTube engine download failed';
                throw new YoutubeEngineServiceError(message, response.status);
            }

            return response;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new YoutubeEngineServiceError('YouTube engine download timed out', 504);
            }
            if (error instanceof YoutubeEngineServiceError) {
                throw error;
            }
            throw new YoutubeEngineServiceError(error instanceof Error ? error.message : 'YouTube engine download failed');
        } finally {
            clearTimeout(timeout);
        }
    }

    public async deleteDownload(jobId: string) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

        try {
            const response = await fetch(`${this.getBaseUrl()}/download/${jobId}`, {
                method: 'DELETE',
                signal: controller.signal,
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const message = data?.error?.message || 'YouTube engine delete failed';
                throw new YoutubeEngineServiceError(message, response.status);
            }

            return data;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new YoutubeEngineServiceError('YouTube engine delete timed out', 504);
            }
            if (error instanceof YoutubeEngineServiceError) {
                throw error;
            }
            throw new YoutubeEngineServiceError(error instanceof Error ? error.message : 'YouTube engine delete failed');
        } finally {
            clearTimeout(timeout);
        }
    }
}

export { YoutubeEngineService, YoutubeEngineServiceError };
export const youtubeEngineService = new YoutubeEngineService();
