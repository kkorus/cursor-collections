# Indexing

Reference for the `tsh-designing-databases` skill. Load this when choosing, reviewing or monitoring indexes.

## Contents

- Indexes

## Indexes

### Index Types

| Type | Syntax (PostgreSQL) | Use Case |
|---|---|---|
| **B-tree** (default) | `CREATE INDEX idx ON table(column)` | Equality and range queries (`=`, `<`, `>`, `BETWEEN`, `ORDER BY`) |
| **Hash** | `CREATE INDEX idx ON table USING hash(column)` | Equality-only lookups (rare — B-tree covers this equally well) |
| **GIN** | `CREATE INDEX idx ON table USING gin(column)` | Full-text search, JSONB containment, array operations |
| **GiST** | `CREATE INDEX idx ON table USING gist(column)` | Geometric/spatial data, range types, nearest-neighbor queries |
| **BRIN** | `CREATE INDEX idx ON table USING brin(column)` | Very large tables with naturally ordered data (timestamps, sequential IDs) |

### Index Strategy Rules

**Always index:**
- Foreign key columns (not auto-indexed in PostgreSQL/MySQL InnoDB)
- Columns frequently used in `WHERE` clauses
- Columns used in `ORDER BY` on large tables
- Columns used in `JOIN` conditions

**Consider composite indexes for:**
- Queries that filter on multiple columns together
- Covering indexes that satisfy a query entirely from the index

**Avoid over-indexing:**
- Each index adds overhead to `INSERT`, `UPDATE`, and `DELETE` operations
- Indexes consume storage
- Review and remove unused indexes periodically

### Composite Index Column Order

The order of columns in a composite index matters. Place columns in this priority:

1. **Equality conditions first** (`WHERE status = 'active'`)
2. **Range conditions second** (`WHERE created_at > '2025-01-01'`)
3. **Sort columns last** (`ORDER BY created_at DESC`)

```sql
-- Query: WHERE status = 'active' AND created_at > '2025-01-01' ORDER BY created_at DESC
-- Optimal index:
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at DESC);
```

### Partial Indexes

Index only the rows you actually query:

```sql
-- Only index active orders (if most queries filter for active)
CREATE INDEX idx_orders_active ON orders(customer_id, created_at)
    WHERE deleted_at IS NULL;
```

### Unique Indexes

Use unique indexes to enforce business constraints:

```sql
-- Email must be unique, but only for non-deleted users
CREATE UNIQUE INDEX uq_users_email_active ON users(email)
    WHERE deleted_at IS NULL;
```

### Index Monitoring

Periodically check for unused indexes:

```sql
-- PostgreSQL: find unused indexes
SELECT
    schemaname, relname AS table_name, indexrelname AS index_name,
    idx_scan AS times_used, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Non-Blocking Index Operations (CONCURRENTLY)

Standard `CREATE INDEX` and `DROP INDEX` acquire locks that **block writes** on the table for the duration of the operation. On large or heavily-used tables this can cause downtime.

**Always use `CONCURRENTLY`** when creating or dropping indexes on tables that serve live traffic:

```sql
-- Creating an index without blocking writes
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);

-- Dropping an index without blocking writes
DROP INDEX CONCURRENTLY idx_orders_customer_id;
```

**Key constraints and caveats:**

| Aspect | Detail |
|---|---|
| **Database support** | `CONCURRENTLY` is PostgreSQL-specific. Other engines have their own online indexing alternatives: MySQL/MariaDB use `ALGORITHM=INPLACE, LOCK=NONE`; SQL Server uses `WITH (ONLINE = ON)`; Oracle uses `ONLINE` keyword. Consult engine-specific docs for constraints and limitations |
| **Transaction blocks** | `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` **cannot run inside a transaction block** — avoid wrapping them in `BEGIN`/`COMMIT` |
| **Migration frameworks** | Most migration tools wrap statements in a transaction by default. Disable this for concurrent index operations (e.g., `disable_ddl_transaction!` in Rails, `atomic = False` in Django, separate migration step in Flyway) |
| **Failed builds** | If `CREATE INDEX CONCURRENTLY` fails, it leaves behind an **invalid index**. Check with `\d table_name` and drop the invalid index before retrying |
| **Unique indexes** | `CREATE UNIQUE INDEX CONCURRENTLY` performs an extra table scan — takes longer but still avoids blocking writes |
| **Build time** | Concurrent builds are slower than regular ones because they require multiple table passes |

**When to skip `CONCURRENTLY`:**
- Initial schema setup or empty tables (no live traffic to block)
- During a maintenance window with no active connections
- Test/development environments
