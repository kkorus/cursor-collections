# Query Performance and SQL Style

Reference for the `tsh-designing-databases` skill. Load this when writing SQL, debugging slow queries with EXPLAIN, or reviewing SQL style and injection safety.

## Contents

- Writing Performant SQL Queries
- Query Debugging with EXPLAIN
- SQL Writing Best Practices

## Writing Performant SQL Queries

### Query Writing Rules

| Rule | Do | Don't |
|---|---|---|
| Specify columns | `SELECT id, name, email FROM users` | `SELECT * FROM users` |
| Use parameterised queries | `WHERE id = $1` / `WHERE id = ?` | `WHERE id = '` + userId + `'` (SQL injection risk) |
| Limit results | `LIMIT 100` or paginate | Unbounded `SELECT` on large tables |
| Filter early | `WHERE` clause narrows rows before joins | Joining full tables then filtering |
| Use EXISTS over IN for subqueries | `WHERE EXISTS (SELECT 1 FROM ...)` | `WHERE id IN (SELECT id FROM ...)` on large sets |
| Avoid functions on indexed columns | `WHERE created_at >= '2025-01-01'` | `WHERE DATE(created_at) = '2025-01-01'` (kills index) |
| Use UNION ALL over UNION | `UNION ALL` when duplicates are acceptable | `UNION` (forces sort + dedup) |

### JOIN Optimisation

#### Join Types and When to Use

| Join Type | Returns | Use When |
|---|---|---|
| `INNER JOIN` | Only matching rows from both tables | You need data that exists in both tables |
| `LEFT JOIN` | All rows from left table + matches from right (NULL if no match) | You need all records from the primary table regardless of match |
| `RIGHT JOIN` | All rows from right table + matches from left | Rarely used — rewrite as LEFT JOIN for readability |
| `CROSS JOIN` | Cartesian product of both tables | Generating combinations (e.g., all products × all regions) |
| `LATERAL JOIN` | Correlated subquery for each row | Top-N per group, complex per-row calculations |

#### Join Performance Guidelines

```sql
-- GOOD: Join on indexed columns, filter early
SELECT o.id, o.created_at, c.name
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'active'
  AND o.created_at >= '2025-01-01'
ORDER BY o.created_at DESC
LIMIT 50;

-- BAD: Joining on expressions, filtering late
SELECT *
FROM orders o
INNER JOIN customers c ON LOWER(c.email) = LOWER(o.customer_email)
WHERE YEAR(o.created_at) = 2025;
```

**Rules:**
- Always join on indexed columns (typically primary keys and foreign keys).
- Place the most restrictive `WHERE` conditions on the driving table to reduce the row set early.
- Avoid joining on computed expressions — create a persisted computed column or a functional index if needed.
- When joining many tables, consider whether a subquery or CTE might be clearer and equally performant.

### Pagination Strategies

**Offset-based pagination** (simple but degrades on large offsets):

```sql
SELECT id, name, email
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000;
-- Database must scan and discard 1000 rows
```

**Keyset/cursor-based pagination** (performant at any depth):

```sql
-- First page
SELECT id, name, email, created_at
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Next page (use last row's values as cursor)
SELECT id, name, email, created_at
FROM users
WHERE deleted_at IS NULL
  AND (created_at, id) < ('2025-02-01T10:00:00Z', '550e8400-e29b-41d4-a716-446655440000')
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Rule:** Use offset-based pagination for admin/back-office UIs with moderate data volumes (< 100k rows). Use keyset pagination for APIs, infinite scrolling, and large datasets.

### Aggregation Best Practices

```sql
-- GOOD: Filter before aggregating
SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
WHERE status = 'completed'
  AND created_at >= '2025-01-01'
GROUP BY customer_id
HAVING COUNT(*) > 5
ORDER BY total_spent DESC;

-- BAD: Aggregating everything then filtering in application code
SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id;
-- Then filtering in PHP/Node/Java... wasted database work
```

### Common Table Expressions (CTEs)

Use CTEs for readability. Be aware that in some databases (PostgreSQL < 12), CTEs act as optimisation fences:

```sql
-- Readable multi-step query
WITH active_customers AS (
    SELECT id, name
    FROM customers
    WHERE status = 'active'
      AND deleted_at IS NULL
),
recent_orders AS (
    SELECT customer_id, COUNT(*) AS order_count
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY customer_id
)
SELECT ac.id, ac.name, COALESCE(ro.order_count, 0) AS recent_orders
FROM active_customers ac
LEFT JOIN recent_orders ro ON ro.customer_id = ac.id
ORDER BY recent_orders DESC;
```

### Window Functions

Use window functions for ranking, running totals, and per-group calculations without collapsing rows:

```sql
-- Rank orders by total within each customer
SELECT
    customer_id,
    id AS order_id,
    total,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rank,
    SUM(total) OVER (PARTITION BY customer_id) AS customer_total
FROM orders
WHERE status = 'completed';
```

### Batch Operations

For large data modifications, batch to avoid long locks and transaction log bloat:

```sql
-- Instead of one massive DELETE:
-- DELETE FROM logs WHERE created_at < '2024-01-01';  -- locks millions of rows

-- Batch delete:
DO $$
DECLARE
    rows_deleted INT;
BEGIN
    LOOP
        DELETE FROM logs
        WHERE id IN (
            SELECT id FROM logs
            WHERE created_at < '2024-01-01'
            LIMIT 5000
        );
        GET DIAGNOSTICS rows_deleted = ROW_COUNT;
        EXIT WHEN rows_deleted = 0;
        COMMIT;
    END LOOP;
END $$;
```

## Query Debugging with EXPLAIN

### EXPLAIN Basics

```sql
-- Show the query plan (does not execute the query)
EXPLAIN SELECT * FROM orders WHERE customer_id = 42;

-- Show the query plan AND execute the query (shows actual timings)
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;

-- Full diagnostic output (PostgreSQL)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'active'
ORDER BY o.created_at DESC
LIMIT 20;
```

### Reading EXPLAIN Output

Key fields to examine:

| Field | What It Tells You |
|---|---|
| **Seq Scan** | Full table scan — often a sign of missing index |
| **Index Scan** | Using an index to find rows — this is what you want |
| **Index Only Scan** | Data served entirely from the index (covering index) — best case |
| **Bitmap Index Scan** | Index used to build a bitmap, then table scanned — common for OR conditions / multiple indexes |
| **Nested Loop** | For each row in outer table, scan inner table — efficient for small outer sets |
| **Hash Join** | Build hash table from one side, probe with the other — efficient for large equijoins |
| **Merge Join** | Both sides sorted, then merged — efficient when both inputs are pre-sorted |
| **Sort** | Explicit sort operation — check if an index could eliminate this |
| **Rows** (estimated) | Planner's estimate of rows processed at this step |
| **Actual Rows** (ANALYZE only) | Real number of rows processed — compare with estimated to find planner misestimates |
| **Buffers** (ANALYZE + BUFFERS) | Shared/local buffers hit (cache) vs read (disk) — high reads = cache miss, consider prewarming or more memory |
| **Cost** | Arbitrary units comparing relative cost of plan steps — lower is better |

### Common Performance Problems and Fixes

| EXPLAIN Symptom | Likely Cause | Fix |
|---|---|---|
| `Seq Scan` on large table | Missing index | Add appropriate index |
| `Seq Scan` despite index existing | Query uses a function on the indexed column | Rewrite query or create a functional index |
| Estimated rows ≠ actual rows (off by 10x+) | Stale statistics | Run `ANALYZE table_name;` |
| `Sort` with high cost | No index matching `ORDER BY` | Add index covering sort columns |
| `Nested Loop` with large inner table | Planner chose wrong join strategy | Verify indexes on join columns; consider increasing `work_mem` |
| `Hash Join` spilling to disk | `work_mem` too small for the hash table | Increase `work_mem` for the session or globally |
| High `Buffers: read` count | Data not in cache | Increase `shared_buffers` or ensure table fits in memory; check for bloated tables |

### Iterative Query Optimisation Process

```
Query optimisation process:
1. [ ] Identify the slow query (application logs, pg_stat_statements, slow query log)
2. [ ] Run EXPLAIN ANALYZE on the query
3. [ ] Identify the most expensive node in the plan
4. [ ] Determine root cause (missing index, bad statistics, inefficient join, sort)
5. [ ] Apply ONE fix at a time
6. [ ] Re-run EXPLAIN ANALYZE and compare
7. [ ] Repeat until acceptable performance is reached
8. [ ] Verify the fix doesn't degrade other queries
```

### MySQL-Specific EXPLAIN Notes

```sql
-- MySQL uses a different EXPLAIN format
EXPLAIN SELECT * FROM orders WHERE customer_id = 42;

-- Key MySQL EXPLAIN columns:
-- type: ALL (full scan) → index → range → ref → eq_ref → const → system (best to worst)
-- possible_keys: indexes the optimiser considered
-- key: index actually used
-- rows: estimated rows scanned
-- Extra: "Using filesort", "Using temporary" are red flags

-- MySQL 8.0+ supports EXPLAIN ANALYZE:
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
```

## SQL Writing Best Practices

### Formatting Standards

```sql
-- GOOD: Readable, consistent formatting
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.total), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON o.customer_id = u.id
    AND o.status = 'completed'
WHERE u.deleted_at IS NULL
  AND u.created_at >= '2025-01-01'
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 50;
```

**Formatting rules:**
- Keywords in UPPERCASE: `SELECT`, `FROM`, `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`
- One column per line in `SELECT` list for queries with more than 3 columns
- `AND`/`OR` at the beginning of the line, indented
- Table aliases: short but meaningful (`u` for `users`, `o` for `orders`)
- Align `JOIN ... ON` conditions consistently
- Always terminate statements with `;`

### Security — Preventing SQL Injection

**Never concatenate user input into SQL strings.** Always use parameterised queries:

```sql
-- GOOD: Parameterised (prepared statement)
-- PostgreSQL / Node.js
SELECT * FROM users WHERE email = $1;

-- MySQL / PHP
SELECT * FROM users WHERE email = ?;
```

**ORM equivalents (all safe by default):**

```typescript
// TypeORM — safe
const user = await userRepository.findOne({ where: { email: userInput } });

// Prisma — safe
const user = await prisma.user.findUnique({ where: { email: userInput } });
```

```php
// Doctrine — safe
$user = $repository->findOneBy(['email' => $userInput]);

// Eloquent — safe
$user = User::where('email', $userInput)->first();
```

```csharp
// Entity Framework — safe
var user = await context.Users.FirstOrDefaultAsync(u => u.Email == userInput);
```

```java
// Hibernate — safe
User user = session.createQuery("FROM User u WHERE u.email = :email", User.class)
    .setParameter("email", userInput)
    .uniqueResult();
```

```go
// GORM — safe
var user User
db.Where("email = ?", userInput).First(&user)
```

**DANGER: Raw queries with string concatenation:**

```typescript
// TypeORM — DANGEROUS if not parameterised
const users = await dataSource.query(`SELECT * FROM users WHERE email = '${userInput}'`); // SQL INJECTION!

// TypeORM — SAFE raw query
const users = await dataSource.query('SELECT * FROM users WHERE email = $1', [userInput]);
```

### NULL Handling

```sql
-- WRONG: = NULL never matches
SELECT * FROM users WHERE deleted_at = NULL;

-- CORRECT: Use IS NULL / IS NOT NULL
SELECT * FROM users WHERE deleted_at IS NULL;

-- Use COALESCE for default values
SELECT COALESCE(u.nickname, u.first_name, 'Anonymous') AS display_name
FROM users u;

-- NULL-safe comparison (when comparing two nullable columns)
-- PostgreSQL:
SELECT * FROM t1 JOIN t2 ON t1.val IS NOT DISTINCT FROM t2.val;
-- MySQL:
SELECT * FROM t1 JOIN t2 ON t1.val <=> t2.val;
```

### UPSERT Patterns

```sql
-- PostgreSQL: INSERT ... ON CONFLICT
INSERT INTO products (sku, name, price, updated_at)
VALUES ('WIDGET-001', 'Widget', 19.99, NOW())
ON CONFLICT (sku)
DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = NOW();

-- MySQL: INSERT ... ON DUPLICATE KEY UPDATE
INSERT INTO products (sku, name, price, updated_at)
VALUES ('WIDGET-001', 'Widget', 19.99, NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    price = VALUES(price),
    updated_at = NOW();
```

### Avoiding Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `SELECT *` | Fetches unnecessary columns, breaks when schema changes | Explicitly list needed columns |
| `N+1 queries` | 1 query to fetch parents + N queries for children | Use `JOIN` or batch loading (`WHERE id IN (...)`) |
| `WHERE column != value` with index | `!=` / `<>` cannot use index efficiently | Restructure as positive condition or check if full scan is acceptable |
| `LIKE '%value%'` | Leading wildcard prevents index use | Use full-text search (`tsvector` in PostgreSQL, `FULLTEXT` in MySQL) |
| `ORDER BY RAND()` | Scans and sorts entire table | Use a sampled approach: `WHERE id >= (SELECT FLOOR(RANDOM() * MAX(id)) FROM table) LIMIT 1` |
| Implicit type conversion | `WHERE varchar_col = 123` may skip index | Match types explicitly: `WHERE varchar_col = '123'` |
| Correlated subquery in SELECT | Executes subquery for every row | Rewrite as `JOIN` or window function |
| Missing `LIMIT` on exploratory queries | Accidentally fetching millions of rows | Always add `LIMIT` when exploring data |
