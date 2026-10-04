# Schema Design

Reference for the `tsh-designing-databases` skill. Load this when designing tables, columns, keys, relationships or normalisation.

## Contents

- Schema Architecture
- Normalisation Strategies
- Relationships & Foreign Keys

## Schema Architecture

### Standard Columns

Every entity table **MUST** include the columns below. Pure junction tables (composite primary key, no attributes of their own) need only `created_at`; add `updated_at` only if link rows are mutable. A junction table that gains its own attributes or lifecycle is an entity and follows the full rule.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- or BIGSERIAL for auto-increment
    -- ... domain columns ...
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

When soft deletes are required by business rules:

```sql
deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
```

### Primary Key Strategy

| Strategy | When to Use | Trade-offs |
|---|---|---|
| `UUID v4` / `UUID v7` | Distributed systems, microservices, public-facing IDs | Larger storage, random UUIDs cause index fragmentation (prefer UUID v7 for ordered inserts) |
| `ULID` | When you need sortable unique IDs with good index locality | Not natively supported in all databases |
| `BIGSERIAL` / `IDENTITY` | Single-database monoliths, internal IDs | Sequential, predictable (security concern if exposed), not portable across DB instances |

**Rule:** Never expose auto-increment IDs in public APIs. Use UUIDs or ULIDs for external identifiers.

### Data Types — Choose Precisely

| Need | Use | Avoid |
|---|---|---|
| Monetary values | `NUMERIC(19,4)` or `DECIMAL(19,4)` | `FLOAT`, `DOUBLE` (precision loss) |
| Timestamps | `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` without timezone |
| Boolean flags | `BOOLEAN` | `TINYINT`, `CHAR(1)` |
| Short text (name, email) | `VARCHAR(n)` with appropriate limit | Unbounded `TEXT` for structured fields |
| Long text (descriptions) | `TEXT` | `VARCHAR(10000)` |
| Enums | `VARCHAR` with CHECK constraint or native ENUM | Magic integers |
| JSON/semi-structured | `JSONB` (PostgreSQL) or `JSON` | Storing relational data as JSON |
| IP addresses | `INET` (PostgreSQL) or `VARCHAR(45)` | `VARCHAR(15)` (IPv6 won't fit) |

### Enum Handling

Prefer CHECK constraints over native ENUM types for portability and ease of migration:

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

Changing the allowed values does not rewrite the table, but a plain `ADD CONSTRAINT ... CHECK` scans the whole table while holding a strong lock. On large PostgreSQL tables add the new constraint as `NOT VALID` and validate it in a separate step:

```sql
BEGIN;
ALTER TABLE orders DROP CONSTRAINT chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')) NOT VALID;
COMMIT;

-- Separate step: scans existing rows without blocking normal reads and writes
ALTER TABLE orders VALIDATE CONSTRAINT chk_orders_status;
```

`NOT VALID` enforces the constraint for new and updated rows immediately; `VALIDATE CONSTRAINT` then checks existing rows under a `SHARE UPDATE EXCLUSIVE` lock. (MySQL and other engines differ; check the engine's documentation.)

### Schema Design Checklist

```
Schema design checklist:
- [ ] Every table has a primary key (UUID or BIGSERIAL)
- [ ] Every entity table has created_at and updated_at columns (pure junction tables: created_at only)
- [ ] All foreign keys have corresponding indexes
- [ ] All columns have appropriate NOT NULL constraints
- [ ] Unique constraints are defined where business rules require uniqueness
- [ ] CHECK constraints enforce valid value ranges and enums
- [ ] Naming follows snake_case conventions consistently
- [ ] Data types are chosen precisely (no FLOAT for money, no TEXT for emails)
- [ ] Soft delete (deleted_at) is used only where business rules require it
- [ ] No business logic is embedded in database triggers or stored procedures (keep logic in the application layer)
```

## Normalisation Strategies

### Normal Forms Reference

| Normal Form | Rule | Violation Example | Fix |
|---|---|---|---|
| **1NF** | Every column holds atomic (indivisible) values. No repeating groups. | `tags: "php,sql,go"` in a single column | Create a separate `tags` table with a junction table |
| **2NF** | 1NF + every non-key column depends on the **entire** primary key (relevant for composite keys) | `order_items(order_id, product_id, product_name)` — `product_name` depends only on `product_id` | Move `product_name` to the `products` table |
| **3NF** | 2NF + no transitive dependencies (non-key column depends on another non-key column) | `employees(id, department_id, department_name)` — `department_name` depends on `department_id`, not on `id` | Move `department_name` to a `departments` table |
| **BCNF** | 3NF + every determinant is a candidate key | Rare in practice; address when composite keys create functional dependency issues | Decompose the table so every determinant is a key |

### When to Use Each Level

**Target 3NF by default.** This eliminates redundancy while keeping the schema manageable.

**Use 2NF** only as an intermediate step when refactoring legacy schemas — never as a design target.

**Use BCNF** when you have composite primary keys with overlapping candidate keys (uncommon in application databases).

### Practical Normalisation Example

**Unnormalised (0NF):**

```
orders:
| order_id | customer_name | customer_email      | items                          |
|----------|---------------|---------------------|--------------------------------|
| 1        | John Doe      | john@example.com    | Widget x2, Gadget x1           |
```

**1NF — Atomic values, no repeating groups:**

```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);
```

**2NF — Remove partial dependencies (product details depend on product, not order):**

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(19,4) NOT NULL
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(19,4) NOT NULL  -- snapshot of price at order time
);
```

**3NF — Remove transitive dependencies (customer depends on customer, not order):**

```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Strategic Denormalisation

Denormalise **only** when you have measured performance data (via `EXPLAIN ANALYZE`) proving that joins are the bottleneck. Common valid cases:

| Pattern | When to Use | Example |
|---|---|---|
| **Materialised/cached columns** | Frequently read aggregate that is expensive to compute on every query | `orders.total_amount` computed from `order_items` and stored on the order row |
| **Snapshot columns** | Values that must be preserved at a point in time even if the source changes | `order_items.unit_price` (price at time of purchase, not current product price) |
| **Read-optimised views** | Reporting or analytics queries that span many tables | Materialised views refreshed periodically |
| **Search/filter columns** | Columns derived from related tables used heavily in WHERE clauses | `orders.customer_country` duplicated from `customers.country` for filtering |

**Rules for denormalisation:**
- Always document **why** the denormalisation exists (code comment + migration description).
- Ensure the denormalised data is kept in sync (application-level updates, triggers as last resort, or materialised view refresh).
- Treat denormalised data as a **cache** — the normalised source remains the source of truth.

## Relationships & Foreign Keys

### Relationship Types

**One-to-Many (most common):**

```sql
-- A customer has many orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

**Many-to-Many (junction table):**

```sql
-- Products can have many tags, tags can belong to many products
CREATE TABLE products_tags (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_products_tags_tag_id ON products_tags(tag_id);
```

**One-to-One:**

```sql
-- Each user has exactly one profile
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500)
);
```

### ON DELETE / ON UPDATE Actions

| Action | Meaning | When to Use |
|---|---|---|
| `RESTRICT` (default) | Prevent deletion if referenced rows exist | Default for most business entities (prevent accidental data loss) |
| `CASCADE` | Delete/update child rows when parent is deleted/updated | Junction tables, dependent child records that have no meaning without parent |
| `SET NULL` | Set FK to NULL when parent is deleted | Optional relationships where the child can exist independently |
| `SET DEFAULT` | Set FK to its default value | Rare — use when a fallback reference makes business sense |
| `NO ACTION` | Same as RESTRICT but checked at end of transaction | When deferred constraint checking is needed |

**Rule:** Default to `RESTRICT`. Use `CASCADE` only on junction tables and tightly coupled child tables. Always explicitly specify the action — never rely on implicit defaults.

### Self-Referencing Relationships

```sql
-- Categories with parent-child hierarchy
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

For deep hierarchies (trees), consider:
- **Adjacency list** (above) — simple, good for shallow trees
- **Materialised path** — `path VARCHAR(500)` storing `/1/5/12/` — good for read-heavy trees
- **Nested sets** — complex to maintain but fast for subtree queries
- **Closure table** — separate table storing all ancestor-descendant pairs — balanced read/write performance
