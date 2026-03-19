import { requestJson } from '../utils/http';
import { writeStructured } from '../utils/output';

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
  json?: boolean;
  output?: string;
  pretty?: boolean;
}

export async function handleMapCommand(
  url: string,
  options: MapOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/operators/website/map',
    body: {
      url,
      ...options,
    },
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Website Map',
  });
}
