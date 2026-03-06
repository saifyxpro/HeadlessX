# Security Hardening Design

Date: 2026-03-07

## Scope

Fix the following confirmed issues:
- Public fallback dashboard API key and implicit localhost trust
- Unauthenticated admin and data routes
- Plaintext API key storage and plaintext credential exposure
- Non-functional job cancellation
- Docker web build filename mismatch
- Firefox preference overwrite when timezone is configured

## Decisions

### Auth boundary
- Remove the `dashboard-internal` fallback and localhost bypass from the API guard.
- Require an explicit `DASHBOARD_INTERNAL_API_KEY` for dashboard-to-API traffic.
- Protect `dashboard`, `profiles`, `proxies`, and `jobs` routes with the same auth middleware used by other protected routes.
- Replace the frontend rewrite-based `/api/*` forwarding with a Next.js route handler that injects the internal API key server-side so browser code never receives a reusable secret.

### Secret handling
- Store API keys as SHA-256 hashes instead of plaintext.
- Maintain a legacy compatibility path so existing plaintext keys continue to work and are upgraded to hashed storage when used.
- Encrypt stored proxy and profile passwords with `CREDENTIAL_ENCRYPTION_KEY` using versioned ciphertext so legacy plaintext values remain readable during migration.
- Redact password values from API responses and return flags indicating whether a credential is configured.

### Dashboard compatibility
- Remove all browser-side `x-api-key` usage from the web app.
- Route dashboard fetches through `/api/*` only.
- Preserve existing proxy/profile secrets on edit when users leave password fields blank.

### Job cancellation
- Register the active page against the running job.
- Abort jobs cooperatively and close the active page on cancel so navigation and waits are interrupted.
- Surface cancelled jobs as cancelled, not as generic failures.

### Reliability fixes
- Rename the Docker web build file to match compose configuration.
- Merge timezone preferences into the existing Firefox preference object instead of replacing it.

## Validation
- API and web builds pass.
- Protected routes reject missing or invalid API keys.
- Dashboard traffic works through the server-side proxy without exposing secrets in browser code.
- API key creation and verification work with hashed storage.
- Proxy and profile APIs no longer return plaintext passwords.
- Cancelling a running job stops execution and marks the job as cancelled.
