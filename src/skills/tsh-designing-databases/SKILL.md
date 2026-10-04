---
name: tsh-designing-databases
description: SQL writing and database engineering patterns, standards, and procedures. Use when designing database schemas, writing performant SQL queries, normalisation strategies, indexing, joins optimisation, locking mechanics, transactions, query debugging with EXPLAIN, and ORM integration. Applies to PostgreSQL, MySQL, MariaDB, SQL Server, and Oracle. Covers ORM usage with TypeORM, Prisma, Doctrine, Eloquent, Entity Framework, Hibernate, and GORM.
type: skill
metadata:
  short-description: "SQL and database design: schemas, indexing, queries, ORMs"
---

# SQL & Database Engineering

This skill provides standards, patterns, and procedures for database schema design, writing performant SQL, query debugging, and database engineering best practices. It is database-engine-agnostic with notes on engine-specific behavior where critical.

## Guiding Principles

| Principle | Application |
|---|---|
| **Data Integrity First** | Enforce constraints at the database level (NOT NULL, UNIQUE, FK, CHECK). Never rely solely on application-level validation. |
| **Least Privilege** | Database users/roles should have only the permissions they need. Application connections should never use the superuser account. |
| **Explicit Over Implicit** | Always specify column lists in SELECT, INSERT, and JOIN clauses. Avoid `SELECT *` in production code. |
| **Measure Before Optimising** | Use `EXPLAIN ANALYZE` to identify actual bottlenecks before adding indexes or restructuring queries. |
| **Schema as Code** | All schema changes go through versioned migration files. Never modify production schemas manually. |

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural nouns | `order_items`, `user_addresses` |
| Columns | `snake_case` | `first_name`, `created_at` |
| Primary keys | `id` (preferred) or `<table_singular>_id` | `id`, `user_id` |
| Foreign keys | `<referenced_table_singular>_id` | `user_id`, `order_id` |
| Indexes | `idx_<table>_<columns>` | `idx_orders_user_id_status` |
| Unique constraints | `uq_<table>_<columns>` | `uq_users_email` |
| Check constraints | `chk_<table>_<description>` | `chk_orders_total_positive` |
| Junction/pivot tables | `<table1>_<table2>` (alphabetical) | `products_tags`, `roles_users` |

**Standard columns:** every entity table has a primary key, `created_at` and `updated_at` (`TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`), plus `deleted_at` only when business rules require soft deletes. Pure junction (many-to-many link) tables are the exception: they use a composite primary key and need only `created_at` (useful for auditing); add `updated_at` only when link rows carry mutable attributes. Junction tables that gain their own attributes or lifecycle (for example `order_items` with quantity and price) are entities and follow the full rule. Key strategy, data types and the schema checklist are in `./references/schema-design.md`.

**Enums:** prefer `VARCHAR` with a CHECK constraint over native ENUM for portability. To change the allowed values on a large PostgreSQL table, drop the old constraint and add the new one as `NOT VALID` (new writes are checked immediately, no full scan under a heavy lock), then run `ALTER TABLE ... VALIDATE CONSTRAINT ...` as a separate step (it scans the table with a weaker lock that does not block normal reads and writes). See `./references/schema-design.md` for the full example.

## Reference Index

Load the reference that matches the task; each starts with a table of contents.

| Reference | Use when |
|---|---|
| `./references/schema-design.md` | Tables, columns, keys, data types, normalisation, relationships, foreign keys |
| `./references/indexing.md` | Choosing index types and column order, partial/unique indexes, `CONCURRENTLY`, index monitoring |
| `./references/query-performance.md` | Writing SQL, joins, pagination, batch operations, EXPLAIN, formatting, injection safety, NULLs, UPSERT |
| `./references/transactions-locking.md` | Transaction boundaries, isolation levels, savepoints, optimistic/pessimistic locking, deadlocks |
| `./references/orm.md` | ORM selection and best practices, N+1, generated SQL review |
| `./references/maintenance.md` | Vacuuming and statistics, slow query identification, connection pooling |

## Implementation Procedure

When writing SQL or designing a database schema, follow this workflow:

```
Implementation progress:
- [ ] Step 1: Understand the data requirements
- [ ] Step 2: Design the schema (entities, relationships, constraints)
- [ ] Step 3: Choose normalisation level and document any denormalisation decisions
- [ ] Step 4: Define indexes based on expected query patterns
- [ ] Step 5: Write the migration(s)
- [ ] Step 6: Write the queries (raw SQL or ORM)
- [ ] Step 7: Run EXPLAIN ANALYZE on critical queries
- [ ] Step 8: Implement appropriate locking and transaction strategy
- [ ] Step 9: Review ORM-generated SQL (if applicable)
- [ ] Step 10: Test with realistic data volumes
```

**Step 1: Understand the data requirements**
Read the task description and acceptance criteria. Identify the entities, their attributes, and the relationships between them. Clarify cardinality (one-to-many, many-to-many).

**Step 2: Design the schema**
Create tables following the naming conventions and standard columns defined in this skill. Define relationships with appropriate foreign keys and ON DELETE actions.

**Step 3: Choose normalisation level**
Target 3NF by default. Document any intentional denormalisation with a clear justification tied to measured performance needs or snapshot requirements.

**Step 4: Define indexes**
Identify the primary query patterns and create indexes to support them. Index all foreign keys. Create composite indexes for multi-column filters and sorts.

**Step 5: Write the migration(s)**
Generate migration files with both `up` and `down` methods. Review the generated DDL before applying.

**Step 6: Write the queries**
Write queries following the performance and formatting rules in this skill. Use parameterised queries. Avoid `SELECT *`.

**Step 7: Run EXPLAIN ANALYZE**
Verify critical query plans. Look for sequential scans on large tables, missing indexes, and planner misestimates.

**Step 8: Implement locking and transaction strategy**
Choose optimistic or pessimistic locking based on the contention profile. Define transaction boundaries and appropriate isolation levels.

**Step 9: Review ORM-generated SQL**
Enable query logging and inspect generated queries for N+1 problems, unnecessary joins, or missing eager loading.

**Step 10: Test with realistic data volumes**
Seed the development database with production-scale data. Verify that queries perform within acceptable time limits under load.

## Connected Skills

- `tsh-designing-architecture` — for designing data models as part of broader system architecture
- `tsh-reviewing-code` — for validating SQL quality, index coverage, and query performance
- `tsh-discovering-technical-context` — for establishing database conventions and existing patterns before designing
