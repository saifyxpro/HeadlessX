import { requestJson } from '../utils/http';
import { writeStructured } from '../utils/output';

export async function handleExaSearchCommand(
  query: string,
  options: {
    type?: 'auto' | 'fast' | 'instant' | 'deep';
    numResults?: number;
    contentMode?: 'highlights' | 'text';
    maxCharacters?: number;
    maxAgeHours?: number;
    category?:
      | 'company'
      | 'research paper'
      | 'news'
      | 'personal site'
      | 'financial report'
      | 'people';
    includeDomains?: string[];
    excludeDomains?: string[];
    systemPrompt?: string;
    json?: boolean;
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/operators/exa/search',
    body: {
      query,
      ...options,
    },
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Exa Search',
  });
}

export async function handleExaStatusCommand(options: {
  json?: boolean;
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/operators/exa/status',
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Exa Status',
  });
}
