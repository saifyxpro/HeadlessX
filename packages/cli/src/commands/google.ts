import { requestJson } from '../utils/http';
import { writeStructured } from '../utils/output';

export interface GoogleOptions {
  gl?: string;
  hl?: string;
  tbs?: 'qdr:h' | 'qdr:d' | 'qdr:w';
  stealth?: boolean;
  json?: boolean;
  output?: string;
  pretty?: boolean;
}

export async function handleGoogleCommand(
  query: string,
  options: GoogleOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/operators/google/ai-search/search',
    body: {
      query,
      ...(options.gl ? { gl: options.gl } : {}),
      ...(options.hl ? { hl: options.hl } : {}),
      ...(options.tbs ? { tbs: options.tbs } : {}),
      ...(options.stealth !== undefined ? { stealth: options.stealth } : {}),
    },
  });

  writeStructured(result, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'Google AI Search',
  });
}
