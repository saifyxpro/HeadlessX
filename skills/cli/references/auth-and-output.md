# Auth And Output

## Canonical Package And Command

- package: `@headlessx-cli/core`
- command: `headlessx`

## Install

```bash
npm install -g @headlessx-cli/core
headlessx --help
```

With pnpm:

```bash
pnpm add -g @headlessx-cli/core
headlessx --help
```

## Auth Precedence

Highest priority first:

1. command flags
2. environment variables
3. stored local credentials
4. default API URL

## Environment Variables

Primary names:

```bash
export HX_API_KEY=your_headlessx_api_key
export HX_API_URL=http://localhost:38473
```

Alternative names:

```bash
export HEADLESSX_API_KEY=your_headlessx_api_key
export HEADLESSX_API_URL=http://localhost:38473
```

## Login Patterns

Interactive:

```bash
headlessx login
```

Interactive `headlessx login` now uses a guided modern prompt with masked API key entry.

Prompt only for the missing field:

```bash
headlessx login --api-key your_headlessx_api_key
headlessx login --api-url http://localhost:38473
```

Direct login:

```bash
headlessx login --api-key your_headlessx_api_key --api-url http://localhost:38473
```

Inspect config:

```bash
headlessx config view
```

Clear config:

```bash
headlessx logout
```

## Output Rules

Prefer markdown/text output for agents and LLM-facing workflows.

Use `--json` only when:

- the user explicitly asks for machine-readable output
- another tool in the workflow will parse the response
- the output is going directly to a `.json` file

Common patterns:

```bash
headlessx google "latest ai news"
headlessx google "latest ai news" --json --pretty
headlessx scrape https://example.com --type content -o page.md
```

## Good Smoke-Check Sequence

```bash
headlessx --help
headlessx login --help
headlessx status
headlessx operators list
```

Python helper:

```bash
python3 scripts/smoke_cli.py
```

Status and doctor do not require an API key for local reachability checks.
When the CLI is not logged in, auth-dependent operator checks are reported as skipped instead of failed.
