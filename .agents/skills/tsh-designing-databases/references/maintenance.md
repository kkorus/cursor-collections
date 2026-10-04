# Maintenance and Monitoring

Reference for the `tsh-designing-databases` skill. Load this when planning vacuuming, slow-query identification or connection pooling.

## Contents

- Database Maintenance & Monitoring

## Database Maintenance & Monitoring

### Statistics and Vacuuming (PostgreSQL)

```sql
-- Update table statistics for the planner
ANALYZE orders;

-- Update statistics for all tables
ANALYZE;

-- Check for table bloat (dead tuples)
SELECT relname, n_dead_tup, n_live_tup,
       ROUND(n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0) * 100, 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Slow Query Identification

```sql
-- PostgreSQL: enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries by total time
SELECT
    calls,
    ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
    ROUND(mean_exec_time::NUMERIC, 2) AS mean_ms,
    ROUND(max_exec_time::NUMERIC, 2) AS max_ms,
    LEFT(query, 200) AS query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

```sql
-- MySQL: enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- queries taking > 1 second
```

### Connection Pooling

- Always use connection pooling in production. Direct connections are expensive to create.
- PostgreSQL: use PgBouncer or built-in pooling in the ORM/driver.
- MySQL: use ProxySQL or driver-level pooling.
- Set pool size based on: `pool_size = (core_count * 2) + effective_spindle_count` (formula from PostgreSQL wiki).
- Monitor for connection exhaustion — set `max_connections` appropriately and alert when pool utilisation exceeds 80%.
