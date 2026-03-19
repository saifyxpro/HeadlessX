import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

export interface CrawlOptions {
  limit?: number;
  maxDepth?: number;
  includeSubdomains?: boolean;
  includeExternal?: boolean;
  includePaths?: string[];
  excludePaths?: string[];
  crawlEntireDomain?: boolean;
  ignoreQueryParameters?: boolean;
  waitForSelector?: string;
  timeout?: number;
  stealth?: boolean;
  wait?: boolean;
  pollInterval?: number;
  output?: string;
  pretty?: boolean;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalStatus(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return ['completed', 'failed', 'cancelled'].includes(normalized);
}

export async function handleCrawlCommand(
  url: string,
  options: CrawlOptions
): Promise<void> {
  const response = await requestJson<{
    success: boolean;
    job?: { id: string };
  }>({
    method: 'POST',
    path: '/api/website/crawl',
    body: {
      url,
      limit: options.limit,
      maxDepth: options.maxDepth,
      includeSubdomains: options.includeSubdomains,
      includeExternal: options.includeExternal,
      includePaths: options.includePaths,
      excludePaths: options.excludePaths,
      crawlEntireDomain: options.crawlEntireDomain,
      ignoreQueryParameters: options.ignoreQueryParameters,
      waitForSelector: options.waitForSelector,
      timeout: options.timeout,
      stealth: options.stealth,
    },
  });

  if (!options.wait || !response.job?.id) {
    writeJson(response, {
      outputPath: options.output,
      pretty: options.pretty,
    });
    return;
  }

  const pollMs = Math.max(1000, (options.pollInterval ?? 5) * 1000);
  let latest: unknown = response;

  while (true) {
    await sleep(pollMs);
    latest = await requestJson({
      path: `/api/jobs/${response.job.id}`,
    });

    const status =
      typeof latest === 'object' &&
      latest &&
      'job' in (latest as Record<string, unknown>) &&
      typeof (latest as Record<string, unknown>).job === 'object' &&
      (latest as Record<string, unknown>).job
        ? ((latest as Record<string, unknown>).job as Record<string, unknown>).status
        : undefined;

    if (isTerminalStatus(status)) {
      break;
    }
  }

  writeJson(latest, {
    outputPath: options.output,
    pretty: options.pretty,
  });
}
