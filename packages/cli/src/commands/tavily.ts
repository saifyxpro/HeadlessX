import { requestJson } from '../utils/http';
import { writeStructured } from '../utils/output';

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
    json?: boolean;
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/operators/tavily/search',
    body: {
      query,
      ...options,
    },
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Tavily Search',
  });
}

export async function handleTavilyResearchCommand(
  query: string,
  options: {
    model?: 'auto' | 'mini' | 'pro';
    citationFormat?: 'numbered' | 'mla' | 'apa' | 'chicago';
    timeout?: number;
    json?: boolean;
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/operators/tavily/research',
    body: {
      query,
      ...options,
    },
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Tavily Research',
  });
}

export async function handleTavilyResultCommand(
  requestId: string,
  options: { json?: boolean; output?: string; pretty?: boolean }
): Promise<void> {
  const result = await requestJson({
    path: `/api/operators/tavily/research/${requestId}`,
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Tavily Result',
  });
}

export async function handleTavilyStatusCommand(options: {
  json?: boolean;
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/operators/tavily/status',
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Tavily Status',
  });
}
