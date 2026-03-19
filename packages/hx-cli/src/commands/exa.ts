import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

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
    output?: string;
    pretty?: boolean;
  }
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/exa/search',
    body: {
      query,
      ...options,
    },
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}

export async function handleExaStatusCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const result = await requestJson({
    path: '/api/exa/status',
  });

  writeJson(result, { outputPath: options.output, pretty: options.pretty });
}
