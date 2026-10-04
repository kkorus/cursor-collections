# ORM Integration

Reference for the `tsh-designing-databases` skill. Load this when working with an ORM (TypeORM, Prisma, Doctrine, Eloquent, Entity Framework, Hibernate, GORM).

## Contents

- ORM Integration Guidelines

## ORM Integration Guidelines

### ORM Selection by Stack

| Stack | Primary ORM | Alternative |
|---|---|---|
| **PHP (Symfony)** | Doctrine ORM | — |
| **PHP (Laravel)** | Eloquent ORM | — |
| **Node.js (NestJS)** | TypeORM or MikroORM | Prisma |
| **Node.js (General)** | Prisma | TypeORM, Drizzle |
| **.NET** | Entity Framework Core | Dapper (micro-ORM for raw SQL) |
| **Java (Spring)** | Hibernate / Spring Data JPA | jOOQ (for SQL-first approach) |
| **Go** | GORM | sqlx (for raw SQL), Ent |

### ORM Best Practices

**1. Always review generated SQL.**
Enable query logging in development to inspect what the ORM generates. Inefficient ORM usage can produce catastrophic queries.

```typescript
// TypeORM: enable query logging
const dataSource = new DataSource({
    logging: ['query', 'error'],
    // ...
});

// Prisma: enable query logging
const prisma = new PrismaClient({
    log: ['query', 'warn', 'error'],
});
```

```php
// Doctrine: enable SQL logger
$configuration->setSQLLogger(new \Doctrine\DBAL\Logging\EchoSQLLogger());

// Laravel: enable query log
DB::enableQueryLog();
// ... run queries ...
dd(DB::getQueryLog());
```

**2. Solve N+1 queries with eager loading.**

```typescript
// TypeORM — eager loading with relations
const orders = await orderRepository.find({
    relations: ['customer', 'items', 'items.product'],
    where: { status: 'active' },
});

// Prisma — include related data
const orders = await prisma.order.findMany({
    where: { status: 'active' },
    include: {
        customer: true,
        items: { include: { product: true } },
    },
});
```

```php
// Eloquent — eager loading
$orders = Order::with(['customer', 'items.product'])
    ->where('status', 'active')
    ->get();

// Doctrine — DQL with joins
$orders = $em->createQuery('
    SELECT o, c, i, p
    FROM App\Entity\Order o
    JOIN o.customer c
    JOIN o.items i
    JOIN i.product p
    WHERE o.status = :status
')->setParameter('status', 'active')
  ->getResult();
```

```csharp
// Entity Framework — eager loading
var orders = await context.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Where(o => o.Status == "active")
    .ToListAsync();
```

```java
// Hibernate / Spring Data JPA — fetch join
@Query("SELECT o FROM Order o " +
       "JOIN FETCH o.customer " +
       "JOIN FETCH o.items i " +
       "JOIN FETCH i.product " +
       "WHERE o.status = :status")
List<Order> findActiveWithDetails(@Param("status") String status);
```

```go
// GORM — preload
var orders []Order
db.Preload("Customer").Preload("Items.Product").
    Where("status = ?", "active").
    Find(&orders)
```

**3. Use raw SQL for complex queries.**
When ORM abstractions produce inefficient SQL or cannot express the query you need, drop to raw SQL:

```typescript
// TypeORM — raw query
const results = await dataSource.query(`
    SELECT u.id, u.email, COUNT(o.id) AS order_count
    FROM users u
    LEFT JOIN orders o ON o.customer_id = u.id AND o.status = 'completed'
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.email
    HAVING COUNT(o.id) > 5
    ORDER BY order_count DESC
    LIMIT $1
`, [50]);

// Prisma — raw query
const results = await prisma.$queryRaw`
    SELECT u.id, u.email, COUNT(o.id) AS order_count
    FROM users u
    LEFT JOIN orders o ON o.customer_id = u.id AND o.status = 'completed'
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.email
    HAVING COUNT(o.id) > 5
    ORDER BY order_count DESC
    LIMIT ${50}
`;
```

**4. ORM Migration Workflow.**
- Generate migrations from entity/model changes, never edit the database directly.
- Review generated migration SQL before applying — ORMs sometimes generate suboptimal DDL.
- Test migrations against a copy of production data to catch issues (data truncation, long-running locks).

**5. Repository Pattern with ORMs.**
Keep all database queries in repository classes. Services should never directly use the ORM's query builder or entity manager:

```
Service → Repository Interface → Repository Implementation (uses ORM)
```

This keeps business logic decoupled from the data access mechanism and makes testing easier (mock the repository interface).
