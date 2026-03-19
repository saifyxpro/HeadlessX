import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

type PlayerClientProfile = 'mobile' | 'default';

interface YoutubeExtractOptions {
  flatPlaylist?: boolean;
  includeFormats?: boolean;
  includeSubtitles?: boolean;
  playlistPreviewLimit?: number;
  playerClientProfile?: PlayerClientProfile;
  metadataLanguage?: string;
  socketTimeout?: number;
  cleanupJobId?: string;
  output?: string;
  pretty?: boolean;
}

interface YoutubeSaveOptions {
  qualityPreset?: 'best' | '1080p' | '720p' | '480p';
  formatId?: string;
  playerClientProfile?: PlayerClientProfile;
  metadataLanguage?: string;
  socketTimeout?: number;
  cleanupJobId?: string;
  output?: string;
  pretty?: boolean;
}

async function runExtractCommand(
  path: string,
  url: string,
  options: YoutubeExtractOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path,
    body: {
      url,
      ...options,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleYoutubeInfoCommand(
  url: string,
  options: YoutubeExtractOptions
): Promise<void> {
  return runExtractCommand('/api/youtube/info', url, options);
}

export async function handleYoutubeFormatsCommand(
  url: string,
  options: YoutubeExtractOptions
): Promise<void> {
  return runExtractCommand('/api/youtube/formats', url, options);
}

export async function handleYoutubeSubtitlesCommand(
  url: string,
  options: YoutubeExtractOptions
): Promise<void> {
  return runExtractCommand('/api/youtube/subtitles', url, options);
}

export async function handleYoutubeSaveCommand(
  url: string,
  options: YoutubeSaveOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/youtube/save',
    body: {
      url,
      ...options,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleYoutubeStatusCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/youtube/status',
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}
