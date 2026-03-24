# headlessx Tests

The original pasted Firecrawl test surface has not been kept as the source of truth for `headlessx`.

Current package direction:

- HeadlessX-first command tree
- API-key auth only
- pnpm workspace compatibility
- no MCP commands in `0.1.22`

The next useful test pass should focus on:

- config storage
- loopback health fallback for localhost-based checks
- request payload shaping
- polling-based jobs watch flows
- command output contracts
