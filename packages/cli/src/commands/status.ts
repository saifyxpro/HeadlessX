import packageJson from '../../package.json';
import { collectBootstrapStatus } from './lifecycle';
import { getApiKey, getApiUrl } from '../utils/config';
import { requestJson } from '../utils/http';
import { checkHttpHealth } from '../utils/lifecycle';
import { writeStructured } from '../utils/output';

interface StatusOptions {
  json?: boolean;
  pretty?: boolean;
  output?: string;
}

function resolveRuntimeTargets(runtime: Awaited<ReturnType<typeof collectBootstrapStatus>>, fallbackApiUrl: string) {
  const local = runtime.local as Record<string, unknown>;
  return {
    apiUrl: typeof local.apiUrl === 'string' ? local.apiUrl : fallbackApiUrl,
    webUrl: typeof local.webUrl === 'string' ? local.webUrl : undefined,
  };
}

export async function handleStatusCommand(options: StatusOptions): Promise<void> {
  const apiKey = getApiKey();
  const configuredApiUrl = getApiUrl();
  const runtime = await collectBootstrapStatus();
  const runtimeTargets = resolveRuntimeTargets(runtime, configuredApiUrl);

  let health: unknown = null;
  let integrations: Record<string, unknown> = {};
  let queue: unknown = null;
  const reachability = {
    api: await checkHttpHealth(`${runtimeTargets.apiUrl.replace(/\/$/, '')}/api/health`),
    web: runtimeTargets.webUrl
      ? await checkHttpHealth(runtimeTargets.webUrl)
      : {
          ok: false,
          detail: 'not configured',
          url: '',
          tried: [],
        },
  };

  if (!runtimeTargets.apiUrl) {
    health = {
      skipped: 'API URL is not configured yet. Run `headlessx init` or set `--api-url`.',
    };
  } else if (!reachability.api.ok) {
    health = {
      skipped: `API is unreachable at ${runtimeTargets.apiUrl}. Check the reachability section before requesting operator status.`,
    };
  } else {
    try {
      health = await requestJson({
        apiUrl: runtimeTargets.apiUrl,
        path: '/api/health',
        requireAuth: false,
      });
    } catch (error) {
      health = { error: error instanceof Error ? error.message : 'Health check failed' };
    }
  }

  if (apiKey && reachability.api.ok) {
    const requests = await Promise.allSettled([
      requestJson({ apiUrl: runtimeTargets.apiUrl, path: '/api/operators/tavily/status' }),
      requestJson({ apiUrl: runtimeTargets.apiUrl, path: '/api/operators/exa/status' }),
      requestJson({ apiUrl: runtimeTargets.apiUrl, path: '/api/operators/youtube/status' }),
      requestJson({ apiUrl: runtimeTargets.apiUrl, path: '/api/operators/google/ai-search/status' }),
      requestJson({ apiUrl: runtimeTargets.apiUrl, path: '/api/jobs/metrics' }),
    ]);

    integrations = {
      tavily: requests[0].status === 'fulfilled' ? requests[0].value : { error: requests[0].reason?.message || 'failed' },
      exa: requests[1].status === 'fulfilled' ? requests[1].value : { error: requests[1].reason?.message || 'failed' },
      youtube: requests[2].status === 'fulfilled' ? requests[2].value : { error: requests[2].reason?.message || 'failed' },
      googleAiSearch: requests[3].status === 'fulfilled' ? requests[3].value : { error: requests[3].reason?.message || 'failed' },
    };
    queue = requests[4].status === 'fulfilled' ? requests[4].value : { error: requests[4].reason?.message || 'failed' };
  } else if (apiKey) {
    integrations = {
      skipped: 'API is unreachable. Operator integration checks will run after the local API is reachable again.',
    };
    queue = {
      skipped: 'API is unreachable. Queue metrics will run after the local API is reachable again.',
    };
  } else {
    integrations = {
      skipped: 'Authentication not configured. Run `headlessx login` to check operator integrations.',
    };
    queue = {
      skipped: 'Authentication not configured. Run `headlessx login` to check queue metrics.',
    };
  }

  const payload = {
    name: 'headlessx',
    version: packageJson.version,
    auth: {
      configured: Boolean(apiKey),
      detail: apiKey
        ? 'API key available for authenticated operator routes.'
        : 'Not logged in. Health checks still run, but operator status and queue metrics are skipped.',
    },
    targets: {
      configuredApiUrl,
      runtimeApiUrl: runtimeTargets.apiUrl,
      runtimeWebUrl: runtimeTargets.webUrl ?? null,
    },
    runtime,
    reachability,
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
