---
name: cli
description: Use when an agent needs to operate HeadlessX through the published `headlessx` CLI instead of calling files or APIs directly. Covers installing the CLI package, logging in with API URL and API key, using markdown-first terminal output, and running commands for website scraping, map, crawl, Google AI Search, Tavily, Exa, YouTube, jobs, and operators. Trigger for requests like "use the CLI", "test the CLI", "show the command", "log in with the CLI", "run HeadlessX from terminal", or "smoke test the CLI".
---

# HeadlessX CLI

Use `headlessx` as the canonical command.

For full command families and route coverage, read:

- `references/command-matrix.md` for operator-by-operator commands
- `references/auth-and-output.md` for auth precedence and output rules
- `references/operator-routes.md` for the current operator-first API mapping

For deterministic validation, run:

- `scripts/smoke_cli.py` to verify install, auth surface, and core help output

## Quick Start

Install and verify:

```bash
npm install -g @headlessx-cli/core
headlessx --help
```

## Authentication Workflow

Use HeadlessX API credentials only. Prefer:

```bash
headlessx login
```

Use flags when the user already has both values:

```bash
headlessx login --api-key your_headlessx_api_key --api-url http://localhost:8000
```

Use environment variables when the session should stay non-interactive. See `references/auth-and-output.md`.

## Output Rules

Prefer the default markdown/text output for LLM-facing use.

Use `--json` only when structured machine-readable output is specifically needed.

## Command Patterns

Read `references/command-matrix.md` before composing multi-step CLI runs. It contains:

- website scrape, map, and crawl examples
- Google AI Search flags
- Tavily, Exa, YouTube, jobs, and operators examples
- file output patterns for markdown and JSON

## Publishing And Install

Current package:

- `@headlessx-cli/core`

Global install:

```bash
npm install -g @headlessx-cli/core
```

Publish flow from this repo:

```bash
cd /home/saifyxpro/CODE/Crawl/HeadlessX/packages/cli
npm login
pnpm type-check
pnpm build
npm publish --access public
```

## Agent Notes

The CLI talks to the HeadlessX API. It does not launch its own separate browser stack.

If the backend uses the persistent browser profile under `apps/api/data`, CLI requests share that backend state because they go through the same API instance.

When a user asks to "test the CLI", prefer:

1. `headlessx --help`
2. `headlessx login --help`
3. `headlessx status`
4. operator-specific help or smoke commands

Use `scripts/smoke_cli.py` when you need a fast deterministic baseline.
