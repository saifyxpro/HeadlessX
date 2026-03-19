import { requestJson } from '../utils/http';
import { writeJson } from '../utils/output';

export interface GoogleOptions {
  output?: string;
  pretty?: boolean;
}

export async function handleGoogleCommand(
  query: string,
  options: GoogleOptions
): Promise<void> {
  const result = await requestJson({
    method: 'POST',
    path: '/api/google-serp/search',
    body: { query },
  });

  writeJson(result, {
    outputPath: options.output,
    pretty: options.pretty,
  });
}
