import { requestJson, requestJsonWithQuery } from '../utils/http';
import { writeJson } from '../utils/output';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalStatus(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return ['completed', 'failed', 'cancelled'].includes(value.toLowerCase());
}

export async function handleJobsListCommand(options: {
  type?: 'scrape' | 'crawl' | 'extract' | 'index';
  status?: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
  limit?: number;
  offset?: number;
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJsonWithQuery({
    path: '/api/jobs',
    query: {
      type: options.type,
      status: options.status,
      limit: options.limit,
      offset: options.offset,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleJobsGetCommand(
  id: string,
  options: { output?: string; pretty?: boolean }
): Promise<void> {
  const result = await requestJson({
    path: `/api/jobs/${id}`,
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleJobsActiveCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/jobs/active',
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleJobsMetricsCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/jobs/metrics',
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleJobsCancelCommand(
  id: string,
  options: { output?: string; pretty?: boolean }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: `/api/jobs/${id}/cancel`,
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleJobsWatchCommand(
  id: string,
  options: { interval?: number; output?: string; pretty?: boolean }
): Promise<void> {
  const intervalMs = Math.max(1000, (options.interval ?? 5) * 1000);
  let latest: unknown = null;

  while (true) {
    latest = await requestJson({
      path: `/api/jobs/${id}`,
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

    await sleep(intervalMs);
  }

  writeJson(latest, { outputPath: options.output, pretty: options.pretty });
}
