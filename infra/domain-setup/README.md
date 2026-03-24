# HeadlessX Domain Setup

This directory is the production domain layer for HeadlessX.

It is designed for:

- Docker-based production deployments
- a dedicated dashboard domain
- a dedicated API domain
- automatic HTTPS through Caddy

## Production Host Requirements

| Item | Minimum | Recommended |
| --- | --- | --- |
| OS | Linux server | Ubuntu 22.04+/24.04 or Debian 12 |
| CPU | 2 vCPU | 4+ vCPU |
| RAM | 8 GB | 16+ GB |
| Disk | 20 GB SSD | 40+ GB SSD |
| Network | public server IP and outbound internet | stable bandwidth with low packet loss |

Required on the host:

- Docker Engine
- Docker Compose v2
- DNS access for your dashboard and API domains
- ports `80` and `443` open to the internet
- an email address for Caddy certificate management

This setup is additive. It does not replace the current `headlessx` API/operator commands. The lifecycle side is intended to work alongside commands like:

- `headlessx scrape`
- `headlessx map`
- `headlessx crawl`
- `headlessx google`
- `headlessx tavily`
- `headlessx exa`
- `headlessx youtube`

## Purpose

The core HeadlessX stack already runs with Docker under:

```text
infra/docker/
```

This directory adds the production reverse-proxy/domain layer on top of that stack.

The intended production shape is:

- HeadlessX app stack running with Docker
- Caddy running in front of it
- one domain for the dashboard
- one domain for the API

Example:

- `dashboard.example.com`
- `api.example.com`

## Files

- `.env.example`
- `docker-compose.yml`
- `Caddyfile.template`

Future `headlessx init --mode production` should generate:

- `infra/domain-setup/.env`
- `infra/domain-setup/Caddyfile`

from the template files in this directory.

## How this works

The Caddy container joins the same Docker network as the HeadlessX app stack and proxies:

- dashboard traffic to the web service
- API traffic to the api service

TLS is handled automatically by Caddy.

## Current Docker Flow

1. Start the core HeadlessX stack from [infra/docker](/home/saifyxpro/CODE/Crawl/HeadlessX/infra/docker)
2. Copy `.env.example` to `.env` in this directory
3. Fill in your domains and email
4. Copy `Caddyfile.template` to `Caddyfile`
5. Start the domain layer with Docker Compose

## Example

```bash
cd infra/domain-setup
cp .env.example .env
cp Caddyfile.template Caddyfile
docker compose up -d
```

## Required values

Set these in `.env`:

- `HEADLESSX_WEB_DOMAIN`
- `HEADLESSX_API_DOMAIN`
- `CADDY_EMAIL`

You can also override:

- `HEADLESSX_WEB_UPSTREAM`
- `HEADLESSX_API_UPSTREAM`
- `HEADLESSX_DOCKER_NETWORK`

## Docker network

By default, this setup expects the HeadlessX app stack to already be running on:

```text
docker_headlessx-network
```

If your Compose project name differs, set `HEADLESSX_DOCKER_NETWORK` in `.env`.

## DNS

Before starting Caddy, point both domains to the server:

- dashboard domain -> server IP
- API domain -> server IP

Without valid DNS, automatic HTTPS will not complete.

## Recommended future CLI behavior

Production mode in `headlessx init` should:

- ask for dashboard domain
- ask for API domain
- ask for Caddy email
- generate `.env`
- generate `Caddyfile`
- optionally start both the app stack and the domain layer

## Notes

- this directory is for production/domain setup only
- the app stack still lives in `infra/docker`
- this directory is intentionally Docker-first
