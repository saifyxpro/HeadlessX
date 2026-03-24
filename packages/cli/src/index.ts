#!/usr/bin/env node

import { Command } from 'commander';
import packageJson from '../package.json';
import { handleSetConfigCommand, handleViewConfigCommand } from './commands/config';
import { handleCrawlCommand } from './commands/crawl';
import { handleExaSearchCommand, handleExaStatusCommand } from './commands/exa';
import { handleGoogleCommand } from './commands/google';
import {
  handleDoctorCommand,
  handleInitCommand,
  handleLogsCommand,
  handleRestartCommand,
  handleStartCommand,
  handleStopCommand,
} from './commands/lifecycle';
import {
  handleJobsActiveCommand,
  handleJobsCancelCommand,
  handleJobsGetCommand,
  handleJobsListCommand,
  handleJobsMetricsCommand,
  handleJobsWatchCommand,
} from './commands/jobs';
import { handleLoginCommand } from './commands/login';
import { handleLogoutCommand } from './commands/logout';
import { handleMapCommand } from './commands/map';
import {
  handleOperatorsCheckCommand,
  handleOperatorsListCommand,
} from './commands/operators';
import { handleScrapeCommand } from './commands/scrape';
import { handleStatusCommand } from './commands/status';
import {
  handleTavilyResearchCommand,
  handleTavilyResultCommand,
  handleTavilySearchCommand,
  handleTavilyStatusCommand,
} from './commands/tavily';
import {
  handleYoutubeFormatsCommand,
  handleYoutubeInfoCommand,
  handleYoutubeSaveCommand,
  handleYoutubeStatusCommand,
  handleYoutubeSubtitlesCommand,
} from './commands/youtube';
import { initializeConfig, updateConfig } from './utils/config';

initializeConfig();

function csvList(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStealthMode(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'on') {
    return true;
  }
  if (normalized === 'off') {
    return false;
  }

  throw new Error('Stealth must be "on" or "off".');
}

const program = new Command();

program
  .name('headlessx')
  .description('HeadlessX command-line client for website, search, YouTube, and jobs workflows.')
  .version(packageJson.version)
  .option('-k, --api-key <key>', 'HeadlessX API key')
  .option('--api-url <url>', 'HeadlessX API URL');

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.apiKey) {
    updateConfig({ apiKey: opts.apiKey });
  }
  if (opts.apiUrl) {
    updateConfig({ apiUrl: opts.apiUrl });
  }
});

program
  .command('init [action]')
  .description('Clone, update, and configure HeadlessX under ~/.headlessx.')
  .option('--mode <mode>', 'developer, self-host, or production')
  .option('--branch <name>', 'Git branch to clone or update')
  .option('--yes', 'Accept recommended defaults and skip confirmation prompts')
  .option('--no-start', 'Prepare the workspace but do not start services')
  .option('--api-domain <domain>', 'Production API domain')
  .option('--web-domain <domain>', 'Production dashboard domain')
  .option('--caddy-email <email>', 'Production Caddy email')
  .action((action, options) => handleInitCommand({ ...options, action }));

program
  .command('start')
  .description('Start the initialized HeadlessX runtime.')
  .action(handleStartCommand);

program
  .command('stop')
  .description('Stop the initialized HeadlessX runtime without deleting data.')
  .action(handleStopCommand);

program
  .command('restart')
  .description('Restart the initialized HeadlessX runtime.')
  .action(handleRestartCommand);

program
  .command('logs [service]')
  .description('Show runtime logs for the initialized HeadlessX workspace.')
  .option('--tail <lines>', 'Number of lines to show', '200')
  .option('--no-follow', 'Print logs and exit without streaming')
  .action((service, options) => handleLogsCommand({ ...options, service }));

program
  .command('doctor')
  .description('Inspect local HeadlessX prerequisites, env files, models, and reachability.')
  .option('--json', 'Output JSON')
  .option('--pretty', 'Pretty-print JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .action(handleDoctorCommand);

program
  .command('login')
  .description('Store HeadlessX API credentials locally.')
  .option('-k, --api-key <key>', 'HeadlessX API key')
  .option('--api-url <url>', 'HeadlessX API URL')
  .action((options, command) => handleLoginCommand(command.optsWithGlobals?.() ?? options));

program
  .command('logout')
  .description('Remove stored credentials.')
  .action(handleLogoutCommand);

const config = program.command('config').description('View or update local headlessx configuration.');
config.command('view').description('Show stored configuration.').action(handleViewConfigCommand);
config
  .command('set')
  .description('Update stored API URL and/or API key.')
  .option('-k, --api-key <key>', 'HeadlessX API key')
  .option('--api-url <url>', 'HeadlessX API URL')
  .action((options, command) => handleSetConfigCommand(command.optsWithGlobals?.() ?? options));
config.action(handleViewConfigCommand);

program
  .command('status')
  .description('Show CLI and backend status.')
  .option('--json', 'Output JSON')
  .option('--pretty', 'Pretty-print JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .action(handleStatusCommand);

program
  .command('scrape')
  .description('Run a direct website scrape against the HeadlessX website routes.')
  .argument('<url>', 'URL to scrape')
  .option('--type <type>', 'content, html, html-js, or screenshot', 'content')
  .option('--wait-for-selector <selector>', 'Selector to wait for before capture')
  .option('--timeout <ms>', 'Timeout in milliseconds', parseInt)
  .option('--stealth <mode>', 'Stealth mode: on or off', parseStealthMode)
  .option('--json', 'Output JSON')
  .option('--pretty', 'Pretty-print JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .action(handleScrapeCommand);

program
  .command('map')
  .description('Discover links on a site through /api/operators/website/map.')
  .argument('<url>', 'Root URL to map')
  .option('--limit <number>', 'Maximum URLs to discover', parseInt)
  .option('--include-subdomains', 'Include subdomains')
  .option('--include-external', 'Include external links')
  .option('--use-sitemap', 'Use sitemap discovery')
  .option('--max-discovery-depth <number>', 'Maximum discovery depth', parseInt)
  .option('--include-paths <paths>', 'Comma-separated include paths')
  .option('--exclude-paths <paths>', 'Comma-separated exclude paths')
  .option('--crawl-entire-domain', 'Crawl entire domain')
  .option('--ignore-query-parameters', 'Ignore query parameters')
  .option('--timeout <seconds>', 'Timeout in seconds', parseInt)
  .option('--stealth <mode>', 'Stealth mode: on or off', parseStealthMode)
  .option('--wait-for-selector <selector>', 'Selector to wait for')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(async (url, options) =>
    handleMapCommand(url, {
      ...options,
      includePaths: csvList(options.includePaths),
      excludePaths: csvList(options.excludePaths),
    })
  );

program
  .command('crawl')
  .description('Create a queue-backed crawl job.')
  .argument('<url>', 'Root URL to crawl')
  .option('--limit <number>', 'Maximum pages', parseInt)
  .option('--max-depth <number>', 'Maximum crawl depth', parseInt)
  .option('--include-subdomains', 'Include subdomains')
  .option('--include-external', 'Include external links')
  .option('--include-paths <paths>', 'Comma-separated include paths')
  .option('--exclude-paths <paths>', 'Comma-separated exclude paths')
  .option('--crawl-entire-domain', 'Crawl entire domain')
  .option('--ignore-query-parameters', 'Ignore query parameters')
  .option('--wait-for-selector <selector>', 'Selector to wait for')
  .option('--timeout <seconds>', 'Timeout in seconds', parseInt)
  .option('--stealth <mode>', 'Stealth mode: on or off', parseStealthMode)
  .option('--wait', 'Poll until the job reaches a terminal state')
  .option('--poll-interval <seconds>', 'Polling interval in seconds', parseInt)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(async (url, options) =>
    handleCrawlCommand(url, {
      ...options,
      includePaths: csvList(options.includePaths),
      excludePaths: csvList(options.excludePaths),
    })
  );

program
  .command('google')
  .description('Run a Google AI Search scrape through HeadlessX.')
  .argument('<query>', 'Search query')
  .option('--gl <code>', 'Google region code, for example pk, us, or in')
  .option('--hl <code>', 'Google language code, for example en or ur')
  .option('--tbs <value>', 'Google time filter: qdr:h, qdr:d, or qdr:w')
  .option('--stealth <mode>', 'Stealth mode: on or off', parseStealthMode)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleGoogleCommand);

const tavily = program.command('tavily').description('Run Tavily search and research workflows.');
tavily
  .command('search')
  .argument('<query>', 'Search query')
  .option('--search-depth <depth>', 'basic or advanced', 'basic')
  .option('--topic <topic>', 'general, news, or finance', 'general')
  .option('--max-results <number>', 'Maximum results', parseInt)
  .option('--include-answer', 'Include Tavily answer')
  .option('--include-images', 'Include images')
  .option('--include-raw-content <mode>', 'false, markdown, or text')
  .option('--include-domains <domains>', 'Comma-separated domains to include')
  .option('--exclude-domains <domains>', 'Comma-separated domains to exclude')
  .option('--time-range <range>', 'day, week, month, or year')
  .option('--timeout <seconds>', 'Timeout in seconds', parseInt)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(async (query, options) =>
    handleTavilySearchCommand(query, {
      ...options,
      includeDomains: csvList(options.includeDomains),
      excludeDomains: csvList(options.excludeDomains),
      includeRawContent:
        options.includeRawContent === 'false'
          ? false
          : options.includeRawContent,
    })
  );
tavily
  .command('research')
  .argument('<query>', 'Research query')
  .option('--model <model>', 'auto, mini, or pro', 'auto')
  .option('--citation-format <format>', 'numbered, mla, apa, or chicago', 'numbered')
  .option('--timeout <seconds>', 'Timeout in seconds', parseInt)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleTavilyResearchCommand);
tavily
  .command('result')
  .argument('<requestId>', 'Research request ID')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleTavilyResultCommand);
tavily
  .command('status')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleTavilyStatusCommand);

const exa = program.command('exa').description('Run Exa search workflows.');
exa
  .command('search')
  .argument('<query>', 'Search query')
  .option('--type <type>', 'auto, fast, instant, or deep', 'auto')
  .option('--num-results <number>', 'Maximum results', parseInt)
  .option('--content-mode <mode>', 'highlights or text', 'highlights')
  .option('--max-characters <number>', 'Maximum character budget', parseInt)
  .option('--max-age-hours <number>', 'Maximum age in hours', parseInt)
  .option('--category <category>', 'Exa category')
  .option('--include-domains <domains>', 'Comma-separated domains to include')
  .option('--exclude-domains <domains>', 'Comma-separated domains to exclude')
  .option('--system-prompt <prompt>', 'Optional Exa system prompt')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(async (query, options) =>
    handleExaSearchCommand(query, {
      ...options,
      includeDomains: csvList(options.includeDomains),
      excludeDomains: csvList(options.excludeDomains),
    })
  );
exa
  .command('status')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleExaStatusCommand);

const youtube = program.command('youtube').description('Run YouTube extraction and save flows.');
youtube
  .command('info')
  .argument('<url>', 'YouTube URL')
  .option('--flat-playlist', 'Return flat playlist data')
  .option('--include-formats', 'Include formats')
  .option('--include-subtitles', 'Include subtitles')
  .option('--playlist-preview-limit <number>', 'Playlist preview limit', parseInt)
  .option('--player-client-profile <profile>', 'mobile or default', 'mobile')
  .option('--metadata-language <code>', 'Metadata language code')
  .option('--socket-timeout <seconds>', 'Socket timeout in seconds', parseInt)
  .option('--cleanup-job-id <id>', 'Delete a previous temporary download first')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleYoutubeInfoCommand);
youtube
  .command('formats')
  .argument('<url>', 'YouTube URL')
  .option('--flat-playlist', 'Return flat playlist data')
  .option('--include-formats', 'Include formats')
  .option('--include-subtitles', 'Include subtitles')
  .option('--playlist-preview-limit <number>', 'Playlist preview limit', parseInt)
  .option('--player-client-profile <profile>', 'mobile or default', 'mobile')
  .option('--metadata-language <code>', 'Metadata language code')
  .option('--socket-timeout <seconds>', 'Socket timeout in seconds', parseInt)
  .option('--cleanup-job-id <id>', 'Delete a previous temporary download first')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleYoutubeFormatsCommand);
youtube
  .command('subtitles')
  .argument('<url>', 'YouTube URL')
  .option('--flat-playlist', 'Return flat playlist data')
  .option('--include-formats', 'Include formats')
  .option('--include-subtitles', 'Include subtitles')
  .option('--playlist-preview-limit <number>', 'Playlist preview limit', parseInt)
  .option('--player-client-profile <profile>', 'mobile or default', 'mobile')
  .option('--metadata-language <code>', 'Metadata language code')
  .option('--socket-timeout <seconds>', 'Socket timeout in seconds', parseInt)
  .option('--cleanup-job-id <id>', 'Delete a previous temporary download first')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleYoutubeSubtitlesCommand);
youtube
  .command('save')
  .argument('<url>', 'YouTube URL')
  .option('--quality-preset <preset>', 'best, 1080p, 720p, or 480p', 'best')
  .option('--format-id <id>', 'Explicit format ID')
  .option('--player-client-profile <profile>', 'mobile or default', 'mobile')
  .option('--metadata-language <code>', 'Metadata language code')
  .option('--socket-timeout <seconds>', 'Socket timeout in seconds', parseInt)
  .option('--cleanup-job-id <id>', 'Delete a previous temporary download first')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleYoutubeSaveCommand);
youtube
  .command('status')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleYoutubeStatusCommand);

const jobs = program.command('jobs').description('Inspect or control HeadlessX jobs.');
jobs
  .command('list')
  .option('--type <type>', 'scrape, crawl, extract, or index')
  .option('--status <status>', 'queued, active, completed, failed, or cancelled')
  .option('--limit <number>', 'Maximum jobs to return', parseInt)
  .option('--offset <number>', 'Offset for pagination', parseInt)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsListCommand);
jobs
  .command('get')
  .argument('<id>', 'Job ID')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsGetCommand);
jobs
  .command('active')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsActiveCommand);
jobs
  .command('metrics')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsMetricsCommand);
jobs
  .command('cancel')
  .argument('<id>', 'Job ID')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsCancelCommand);
jobs
  .command('watch')
  .argument('<id>', 'Job ID')
  .option('--interval <seconds>', 'Polling interval in seconds', parseInt)
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleJobsWatchCommand);

const operators = program
  .command('operators')
  .description('Inspect the current HeadlessX operators catalog.');
operators
  .command('list')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleOperatorsListCommand);
operators
  .command('check')
  .option('--json', 'Output JSON')
  .option('-o, --output <path>', 'Write output to a file')
  .option('--pretty', 'Pretty-print JSON')
  .action(handleOperatorsCheckCommand);

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
