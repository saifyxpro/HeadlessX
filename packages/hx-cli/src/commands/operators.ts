import { requestJson } from '../utils/http';
import { writeJson, writeText } from '../utils/output';

type OperatorState =
  | 'active'
  | 'configuration_required'
  | 'coming_soon'
  | 'offline';

interface OperatorRecord {
  id: string;
  name: string;
  tagline: string;
  category: string;
  available: boolean;
  comingSoon: boolean;
  state: OperatorState;
  reason: string | null;
  playgroundHref: string;
  apiBasePath?: string;
  features: string[];
}

interface OperatorsPayload {
  success: boolean;
  data: {
    operators: OperatorRecord[];
  };
}

function formatOperatorState(operator: OperatorRecord): string {
  switch (operator.state) {
    case 'active':
      return 'active';
    case 'configuration_required':
      return 'config required';
    case 'offline':
      return 'offline';
    case 'coming_soon':
      return 'coming soon';
    default:
      return operator.state;
  }
}

function formatHumanSummary(operators: OperatorRecord[]): string {
  const lines = ['HeadlessX Operators', ''];

  for (const operator of operators) {
    const suffix = operator.reason ? ` - ${operator.reason}` : '';
    lines.push(
      `${operator.name} (${operator.id}): ${formatOperatorState(operator)}${suffix}`
    );
  }

  return lines.join('\n');
}

async function fetchOperators(): Promise<OperatorsPayload> {
  return requestJson<OperatorsPayload>({
    path: '/api/playground/operators',
  });
}

export async function handleOperatorsListCommand(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const payload = await fetchOperators();
  writeJson(payload, {
    outputPath: options.output,
    pretty: options.pretty,
  });
}

export async function handleOperatorsCheckCommand(options: {
  json?: boolean;
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  const payload = await fetchOperators();

  if (options.json || options.output?.endsWith('.json')) {
    writeJson(payload, {
      outputPath: options.output,
      pretty: options.pretty,
    });
    return;
  }

  writeText(formatHumanSummary(payload.data.operators), options.output);
}
