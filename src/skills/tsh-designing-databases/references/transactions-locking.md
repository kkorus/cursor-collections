# Transactions and Locking

Reference for the `tsh-designing-databases` skill. Load this when defining transaction boundaries, isolation levels or locking strategy.

## Contents

- Transactions
- Locking Mechanics

## Transactions

### ACID Properties

| Property | Meaning | Practical Impact |
|---|---|---|
| **Atomicity** | All operations in a transaction succeed or all are rolled back | Partial updates never reach the database |
| **Consistency** | Transaction moves the database from one valid state to another | Constraints are enforced (per statement by default; deferred constraints are checked at commit) |
| **Isolation** | Concurrent transactions don't interfere with each other | Determined by the isolation level |
| **Durability** | Committed data survives system failures | Data is persisted to disk on commit |

### Transaction Isolation Levels

| Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | Use Case |
|---|---|---|---|---|
| `READ UNCOMMITTED` | Yes | Yes | Yes | Almost never — only for dirty analytics on non-critical data |
| `READ COMMITTED` | No | Yes | Yes | **Default for PostgreSQL.** Good for most OLTP workloads |
| `REPEATABLE READ` | No | No | Yes* | Financial calculations, inventory checks within a transaction |
| `SERIALIZABLE` | No | No | No | Critical financial operations, booking systems with strict consistency |

*PostgreSQL's `REPEATABLE READ` also prevents phantom reads (it uses snapshot isolation internally).

**Rule:** Use `READ COMMITTED` by default. Escalate to `REPEATABLE READ` or `SERIALIZABLE` only for specific operations that require stronger guarantees, and handle serialisation failures with retry logic.

### Transaction Best Practices

```sql
-- GOOD: Short, focused transaction
BEGIN;
    UPDATE accounts SET balance = balance - 100.00 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;
    INSERT INTO transactions (from_id, to_id, amount) VALUES (1, 2, 100.00);
COMMIT;
```

**Rules:**
- Keep transactions as short as possible. Long transactions hold locks and block other operations.
- Never perform external I/O (HTTP calls, file operations) inside a transaction.
- Always handle transaction failures: catch exceptions, rollback, and optionally retry.
- Use `SAVEPOINT` for partial rollbacks within a larger transaction when needed.
- Acquire locks in a consistent order across all transactions to prevent deadlocks (e.g., always lock by ascending ID).

### Savepoints

```sql
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (1, 250.00);
    SAVEPOINT before_items;

    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 99, 1);
    -- If this fails:
    ROLLBACK TO SAVEPOINT before_items;
    -- Order is still inserted, items are rolled back

COMMIT;
```

## Locking Mechanics

### Lock Types

| Lock Type | SQL | Scope | Behaviour |
|---|---|---|---|
| **Row-level shared (FOR SHARE)** | `SELECT ... FOR SHARE` | Row | Other transactions can read but not modify the row |
| **Row-level exclusive (FOR UPDATE)** | `SELECT ... FOR UPDATE` | Row | Other transactions cannot modify or lock the row; plain reads are not blocked (MVCC) |
| **Table-level** | `LOCK TABLE ... IN <mode> MODE` | Table | Applies to the entire table — use sparingly |
| **Advisory locks** | `pg_advisory_lock(key)` | Application-defined | Application-level coordination, not tied to specific rows |

### Optimistic Locking

Optimistic locking assumes conflicts are rare. It checks for conflicts at write time using a version column:

```sql
-- Schema
ALTER TABLE products ADD COLUMN version INT NOT NULL DEFAULT 1;

-- Read: fetch current version
SELECT id, name, price, stock, version FROM products WHERE id = 42;
-- Application receives: version = 3

-- Update: include version check
UPDATE products
SET stock = stock - 1, version = version + 1, updated_at = NOW()
WHERE id = 42 AND version = 3;

-- If 0 rows affected → another transaction modified the row → handle conflict (retry or error)
```

**When to use:**
- Low contention (concurrent writes to the same row are rare)
- Read-heavy workloads
- User-facing forms where edits happen seconds/minutes apart
- Distributed systems where holding database locks across requests is impractical

**ORM support:**

| ORM | Implementation |
|---|---|
| **TypeORM** | `@VersionColumn()` decorator |
| **Prisma** | Manual implementation via `version` field and conditional update |
| **Doctrine (PHP)** | `#[ORM\Version]` attribute on an integer or datetime column |
| **Eloquent (Laravel)** | Manual implementation or `laravel-optimistic-locking` package |
| **Entity Framework (.NET)** | `[Timestamp]` attribute or `IsRowVersion()` in Fluent API |
| **Hibernate (Java)** | `@Version` annotation |
| **GORM (Go)** | Plugin `gorm.io/plugin/optimisticlock` (`optimisticlock.Version` field), or a manual `UPDATE ... WHERE version = ?` that checks `RowsAffected` |

### Pessimistic Locking

Pessimistic locking assumes conflicts are likely. It acquires locks at read time to prevent concurrent modification:

```sql
-- Lock the row immediately — other transactions block until this transaction commits
BEGIN;
    SELECT * FROM inventory WHERE product_id = 42 FOR UPDATE;
    -- ... perform business logic ...
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 42;
COMMIT;
```

**Variants:**

```sql
-- FOR UPDATE SKIP LOCKED — skip already-locked rows (useful for job queues)
SELECT id, payload
FROM job_queue
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- FOR UPDATE NOWAIT — fail immediately if the row is locked (instead of blocking)
SELECT * FROM inventory WHERE product_id = 42 FOR UPDATE NOWAIT;
-- Throws an error immediately if the row is locked by another transaction
```

**When to use:**
- High contention (concurrent writes to the same row are likely)
- Critical sections that must not have conflicts (inventory decrements, booking seats)
- Short-lived transactions where holding a lock briefly is acceptable
- Job queues and task processing (`SKIP LOCKED`)

### Optimistic vs Pessimistic — Decision Guide

| Factor | Optimistic | Pessimistic |
|---|---|---|
| Conflict frequency | Low (< 1% of operations) | High or unpredictable |
| Read/write ratio | Read-heavy | Write-heavy on contested resources |
| Transaction duration | Can be long (no locks held) | Must be short (locks block others) |
| Failure handling | Retry on conflict | Block until lock is released |
| Distributed systems | Preferred (no lock coordination needed) | Difficult (requires sticky sessions or distributed locks) |
| User experience | May show "conflict, please retry" | May show loading/waiting if contention is high |

### Deadlock Prevention

1. **Consistent lock ordering:** Always acquire locks in the same order (e.g., by ascending primary key).
2. **Short transactions:** Minimise the time locks are held.
3. **Lock timeout:** Set `lock_timeout` to avoid indefinite blocking.
4. **Detect and retry:** Handle deadlock exceptions and retry the transaction.

```sql
-- PostgreSQL: set a lock timeout
SET lock_timeout = '5s';

-- MySQL: set innodb_lock_wait_timeout per session
SET innodb_lock_wait_timeout = 5;
```
