import packageJson from '../../package.json';
import { getApiKey, getApiUrl } from '../utils/config';
import { requestJson } from '../utils/http';
import { writeJson, writeText } from '../utils/output';

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
      requestJson({ path: '/api/tavily/status' }),
      requestJson({ path: '/api/exa/status' }),
      requestJson({ path: '/api/youtube/status' }),
      requestJson({ path: '/api/google-serp/status' }),
      requestJson({ path: '/api/jobs/metrics' }),
    ]);

    integrations = {
      tavily: requests[0].status === 'fulfilled' ? requests[0].value : { error: requests[0].reason?.message || 'failed' },
      exa: requests[1].status === 'fulfilled' ? requests[1].value : { error: requests[1].reason?.message || 'failed' },
      youtube: requests[2].status === 'fulfilled' ? requests[2].value : { error: requests[2].reason?.message || 'failed' },
      googleSerp: requests[3].status === 'fulfilled' ? requests[3].value : { error: requests[3].reason?.message || 'failed' },
    };
    queue = requests[4].status === 'fulfilled' ? requests[4].value : { error: requests[4].reason?.message || 'failed' };
  }

  const payload = {
    name: 'hx-cli',
    version: packageJson.version,
    apiUrl,
    authenticated: Boolean(apiKey),
    health,
    integrations,
    queue,
  };

  if (options.json || options.output) {
    writeJson(payload, { outputPath: options.output, pretty: options.pretty });
    return;
  }

  const lines = [
    `hx-cli v${packageJson.version}`,
    `API URL: ${apiUrl}`,
    `Authenticated: ${apiKey ? 'yes' : 'no'}`,
    '',
    `Health: ${typeof health === 'object' && health && 'status' in (health as Record<string, unknown>) ? String((health as Record<string, unknown>).status) : 'unavailable'}`,
  ];

  if (apiKey) {
    lines.push('');
    lines.push('Integrations:');
    for (const [name, value] of Object.entries(integrations)) {
      const status =
        typeof value === 'object' && value && 'data' in (value as Record<string, unknown>)
          ? JSON.stringify((value as Record<string, unknown>).data)
          : JSON.stringify(value);
      lines.push(`- ${name}: ${status}`);
    }
  }

  writeText(lines.join('\n'), options.output);
}
