import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

export async function handleTavilySearchCommand(
  query: string,
  options: {
    searchDepth?: 'basic' | 'advanced';
    topic?: 'general' | 'news' | 'finance';
    maxResults?: number;
    includeAnswer?: boolean;
    includeImages?: boolean;
    includeRawContent?: false | 'markdown' | 'text';
    includeDomains?: string[];
    excludeDomains?: string[];
    timeRange?: 'day' | 'week' | 'month' | 'year';
    timeout?: number;
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/tavily/search',
    body: {
      query,
      ...options,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleTavilyResearchCommand(
  query: string,
  options: {
    model?: 'auto' | 'mini' | 'pro';
    citationFormat?: 'numbered' | 'mla' | 'apa' | 'chicago';
    timeout?: number;
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/tavily/research',
    body: {
      query,
      ...options,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleTavilyResultCommand(
  requestId: string,
  options: { output?: string; pretty?: boolean }
): Promise<void> {
  const result = await requestJson({
    path: `/api/tavily/research/${requestId}`,
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleTavilyStatusCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/tavily/status',
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}
