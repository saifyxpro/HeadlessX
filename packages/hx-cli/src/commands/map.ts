import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

export interface MapOptions {
  limit?: number;
  includeSubdomains?: boolean;
  includeExternal?: boolean;
  useSitemap?: boolean;
  maxDiscoveryDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  crawlEntireDomain?: boolean;
  ignoreQueryParameters?: boolean;
  timeout?: number;
  stealth?: boolean;
  waitForSelector?: string;
  output?: string;
  pretty?: boolean;
}

export async function handleMapCommand(
  url: string,
  options: MapOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/website/map',
    body: {
      url,
      ...options,
    },
  });

  writeJson(result, {
    outputPath: options.output,
    pretty: options.pretty,
  });
}
