# Local Development and Docker

## Contents

- Local environment
- Dockerfile best practices

## Local environment

- Every project should include a `Dockerfile` and a Compose file (`compose.yaml`; `docker-compose.yml` is still accepted) for local development.
- The Compose file should include all required services: app, database (PostgreSQL), cache (Redis), and a mail catcher such as Mailpit.
- Use `compose.override.yaml` (or `docker-compose.override.yml`) for developer-specific customizations (additional ports, volumes, debug settings).
- The application should be fully runnable with a single `docker compose up` command (Compose v2 CLI).
- Run database migrations as a separate step or one-off job (for example a `migrate` service that the app waits for), not as a side effect of application startup.

## Dockerfile best practices

- Use multi-stage builds to keep images small.
- Pin base image versions to the current LTS or supported release of the runtime (check the runtime's release page or endoflife.date), for example `node:<current-lts>-alpine`. See the language reference for a Dockerfile sketch.
- Install only production dependencies in the final stage.
- Use `.dockerignore` to exclude build artifacts, test files, etc.
- Run as a non-root user in the container.
