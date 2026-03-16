# Contributing to HeadlessX

Thanks for contributing to HeadlessX.

## Before You Start

- Read the main [README](README.md)
- Review the [Setup Guide](docs/setup-guide.md)
- Review the [API Reference](docs/api-endpoints.md)
- Follow the project [Code of Conduct](docs/CODE_OF_CONDUCT.md)

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create your environment files:

```bash
cp .env.example .env
```

If you are using Docker for infrastructure:

```bash
cp infra/docker/.env.example infra/docker/.env
```

3. Prepare local services and runtime dependencies as needed:

```bash
pnpm db:push
pnpm camoufox:fetch
```

4. Start the workspace:

```bash
pnpm dev
```

Important:

- `pnpm dev` starts the app processes, not PostgreSQL or Redis
- queue-backed features require Redis and the worker
- YouTube features require the local `yt-engine` runtime unless you have wired your own container setup

## Project Areas

- `apps/api` - Express API, worker, queue flows, MCP
- `apps/web` - Next.js dashboard
- `apps/yt-engine` - Python YouTube engine
- `apps/go-html-to-md-service` - Go HTML-to-Markdown sidecar
- `docs` - setup, API, and project guides

## Contribution Workflow

1. Fork the repository
2. Create a focused branch
3. Make your changes
4. Run the relevant checks
5. Open a pull request with a clear summary

## Recommended Checks

Run the checks relevant to your changes before opening a pull request:

```bash
pnpm build
pnpm lint
```

Add any extra app-specific verification that applies to your change.

## Pull Requests

- Keep changes focused and reviewable
- Update docs when behavior, setup, routes, or configuration change
- Include screenshots for UI changes when useful
- Mention infrastructure requirements if your change depends on Redis, PostgreSQL, Docker, or external services

## Commit Messages

- Use imperative mood
- Keep the first line concise
- Prefer conventional, scoped messages when possible

Examples:

- `feat(api): add remote MCP endpoint`
- `fix(web): align scraper run button styles`
- `docs: refresh setup and API guides`

## Additional Guides

- [Setup Guide](docs/setup-guide.md)
- [API Reference](docs/api-endpoints.md)
- [Docs Contributing Guide](docs/CONTRIBUTING.md)
- [Security Policy](docs/SECURITY.md)
