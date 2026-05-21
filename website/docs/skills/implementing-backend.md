---
sidebar_position: 11
title: Backend Implementation
---

# Backend Implementation

**Folder:** `.cursor/skills/workflows/tsh-implementing-backend/`  
**Used by:** Software Engineer

Provides patterns for building backend API services with modular architecture, structured testing, and production-ready infrastructure. Applies to Node.js, PHP, .NET, Java, and Go backends.

## Architecture: Vertical Slice / Modular Structure

Organize code by **domain/feature**, not by technical layer. All artifacts for a domain live in the same directory:

```
src/
├── users/
│   ├── users.controller.ts      # HTTP layer (routes, request/response)
│   ├── users.service.ts          # Business logic
│   ├── users.repository.ts       # Data access
│   ├── users.module.ts           # Module registration / DI wiring
│   ├── dto/
│   ├── entities/
│   └── tests/
├── shared/                       # Cross-cutting concerns only
│   ├── middleware/
│   ├── guards/
│   └── utils/
```

## Guiding Principles

| Principle | Application |
|---|---|
| **SRP** | Controllers handle HTTP, services handle business logic, repositories handle data access |
| **DRY** | Extract shared validation, mapping, or query logic into reusable utilities |
| **KISS** | Prefer simple, readable solutions — avoid over-engineering |
| **YAGNI** | Implement what is needed now, not "just in case" |

## REST API Patterns

- Use plural nouns for resource names (`/users`, `/orders`)
- `GET /resource` — list with pagination and filtering
- `POST /resource` — create
- `PATCH /resource/:id` — partial update
- `DELETE /resource/:id` — delete
- Return consistent error envelopes: `{ message, code, statusCode }`

## Testing Strategy

| Level | Tool | What to Test |
|---|---|---|
| **Unit** | Jest / Vitest | Business logic, utilities, validators |
| **Integration** | Supertest / testcontainers | Endpoints, database queries |
| **E2E** | Playwright | Full user flows |

## Anti-Patterns

| Anti-Pattern | Correction |
|---|---|
| Business logic in controllers | Move to service layer |
| Direct DB access in controllers | Use repository pattern |
| Raw SQL strings in services | Use ORM query builder or parameterized queries |
| Missing input validation | Validate all incoming DTOs at the controller boundary |
| Unhandled promise rejections | Always wrap async routes in error middleware |

## Connected Skills

- `tsh-sql-and-database-understanding` — Database schema, indexing, ORM patterns.
- `tsh-technical-context-discovering` — Project conventions and existing patterns.
- `tsh-implementing-observability` — Logging, metrics, and distributed tracing.
