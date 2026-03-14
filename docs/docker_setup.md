# Docker Setup Guide

HeadlessX provides a complete, production-ready Docker Compose setup that orchestrates the entire monorepo stack (PostgreSQL, API, and Web Dashboard).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

To start the entire HeadlessX stack in the background, run:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This will start:
1. **PostgreSQL Database** (Port `5432`)
2. **HeadlessX API** (Port `8000`)
3. **HeadlessX Web Dashboard** (Port `3000`)

You can access the dashboard at [http://localhost:3000](http://localhost:3000).
The API container automatically runs `prisma migrate deploy` before booting, so Docker users do not need to apply database migrations manually.

## Configuration

The Docker setup uses environment variables defined in your `.env` file. Make sure you have created one from the example:

```bash
cp .env.example .env
```

Before starting the stack, generate the required secrets and set them in `.env`:

```bash
openssl rand -hex 32  # DASHBOARD_INTERNAL_API_KEY
openssl rand -hex 32  # CREDENTIAL_ENCRYPTION_KEY
```

### Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | The port the API runs on |
| `WEB_PORT` | `3000` | The port the Web Dashboard runs on |
| `DASHBOARD_INTERNAL_API_KEY` | none | Required shared secret between the dashboard server and API |
| `CREDENTIAL_ENCRYPTION_KEY` | none | Required key for encrypting stored proxy/profile passwords |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `headlessx` | Database name |

If either security variable is missing, the API container will fail fast during startup.

## Docker Profiles

The `docker-compose.yml` file uses Docker Profiles to allow you to run specific parts of the stack.

### Run only the Database
Useful if you want to run the API and Web locally for development but need a containerized database:
```bash
docker compose -f infra/docker/docker-compose.yml --profile db up -d
```

### Run Database + API
```bash
docker compose -f infra/docker/docker-compose.yml --profile api up -d
```

## Rebuilding Images

If you make changes to the code or install new dependencies, you need to rebuild the Docker images:

```bash
docker compose -f infra/docker/docker-compose.yml build
# or
docker compose -f infra/docker/docker-compose.yml up -d --build
```

## Viewing Logs

To view the logs of all services:
```bash
docker compose -f infra/docker/docker-compose.yml logs -f
```

To view logs for a specific service (e.g., the API):
```bash
docker compose -f infra/docker/docker-compose.yml logs -f api
```

## Stopping the Stack

To stop the containers without deleting the database data:
```bash
docker compose -f infra/docker/docker-compose.yml stop
```

To stop and remove the containers (database data is preserved in the `pgdata` volume):
```bash
docker compose -f infra/docker/docker-compose.yml down
```

To completely wipe everything, including the database volume:
```bash
docker compose -f infra/docker/docker-compose.yml down -v
```
