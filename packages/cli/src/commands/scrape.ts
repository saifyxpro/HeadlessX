import { requestBuffer, requestJson } from '../utils/http';
import { writeBuffer, writeJson, writeText } from '../utils/output';

export interface ScrapeOptions {
  type: 'content' | 'html' | 'html-js' | 'screenshot';
  waitForSelector?: string;
  timeout?: number;
  stealth?: boolean;
  output?: string;
  json?: boolean;
  pretty?: boolean;
}

function buildBody(url: string, options: ScrapeOptions) {
  return {
    url,
    stealth: options.stealth,
    timeout: options.timeout,
    waitForSelector: options.waitForSelector,
    options: {
      timeout: options.timeout,
      waitForSelector: options.waitForSelector,
      stealth: options.stealth,
    },
  };
}

function resolvePath(type: ScrapeOptions['type']): string {
  switch (type) {
    case 'html':
      return '/api/operators/website/scrape/html';
    case 'html-js':
      return '/api/operators/website/scrape/html-js';
    case 'screenshot':
      return '/api/operators/website/scrape/screenshot';
    case 'content':
    default:
      return '/api/operators/website/scrape/content';
  }
}

export async function handleScrapeCommand(
  url: string,
  options: ScrapeOptions
): Promise<void> {
  const path = resolvePath(options.type);
  const body = buildBody(url, options);

  if (options.type === 'screenshot') {
    if (!options.output) {
      throw new Error('Screenshot output requires --output <path>.');
    }

    const buffer = await requestBuffer({
      method: 'POST',
      path,
      body,
    });
    writeBuffer(buffer, options.output);
    return;
  }

  const result = await requestJson<Record<string, unknown>>({
    method: 'POST',
    path,
    body,
  });

  if (options.json || options.output?.endsWith('.json')) {
    writeJson(result, { outputPath: options.output, pretty: options.pretty });
    return;
  }

  if (options.type === 'content' && typeof result.markdown === 'string') {
    writeText(result.markdown, options.output);
    return;
  }

  if ((options.type === 'html' || options.type === 'html-js') && typeof result.html === 'string') {
    writeText(result.html, options.output);
    return;
  }

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}
