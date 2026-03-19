import packageJson from '../../package.json';
import { getApiKey, getApiUrl } from '../utils/config';
import { requestJson } from '../utils/http';
import { writeStructured } from '../utils/output';

interface StatusOptions {
  json?: boolean;
  pretty?: boolean;
  output?: string;
}

export async function handleStatusCommand(options: StatusOptions): Promise<void> {
  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  let health: unknown = null;
  let integrations: Record<string, unknown> = {};
  let queue: unknown = null;

  try {
    health = await requestJson({
      path: '/api/health',
      requireAuth: false,
    });
  } catch (error) {
    health = { error: error instanceof Error ? error.message : 'Health check failed' };
  }

  if (apiKey) {
    const requests = await Promise.allSettled([
      requestJson({ path: '/api/operators/tavily/status' }),
      requestJson({ path: '/api/operators/exa/status' }),
      requestJson({ path: '/api/operators/youtube/status' }),
      requestJson({ path: '/api/operators/google/ai-search/status' }),
      requestJson({ path: '/api/jobs/metrics' }),
    ]);

    integrations = {
      tavily: requests[0].status === 'fulfilled' ? requests[0].value : { error: requests[0].reason?.message || 'failed' },
      exa: requests[1].status === 'fulfilled' ? requests[1].value : { error: requests[1].reason?.message || 'failed' },
      youtube: requests[2].status === 'fulfilled' ? requests[2].value : { error: requests[2].reason?.message || 'failed' },
      googleAiSearch: requests[3].status === 'fulfilled' ? requests[3].value : { error: requests[3].reason?.message || 'failed' },
    };
    queue = requests[4].status === 'fulfilled' ? requests[4].value : { error: requests[4].reason?.message || 'failed' };
  }

  const payload = {
    name: 'headlessx',
    version: packageJson.version,
    apiUrl,
    authenticated: Boolean(apiKey),
    health,
    integrations,
    queue,
  };

  writeStructured(payload, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: `headlessx v${packageJson.version}`,
  });
}
