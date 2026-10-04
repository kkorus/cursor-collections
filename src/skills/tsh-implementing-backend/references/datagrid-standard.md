# DataGrid: Filtering, Sorting & Pagination (TSH Standard)

This is a TSH team convention, not an industry standard. Follow it for list endpoints unless the project defines its own pagination contract.

## Contents

- Request Query Parameters
- Filter Behavior
- Advanced Filter Operators
- Response Format


Every list endpoint returning paginated data **MUST** follow this schema.

## Request Query Parameters

| Parameter | Format | Description |
|---|---|---|
| `page` | `page=1` | Page number (starting from 1) |
| `limit` | `limit=10` | Max results per page |
| `sort[field]` | `sort[lastName]=ASC` | Sort by field, direction: `ASC` or `DESC` |
| `filter[field]` | `filter[firstName]=John` | Filter by field value |
| `search` | `search=john` | General text search (implementation-specific: LIKE, full-text, etc.) |

**Example:** `GET /users?page=1&limit=10&sort[lastName]=ASC&filter[status]=active&search=john`

## Filter Behavior

- **Same field, multiple values** → interpreted as `OR`:
  ```
  ?filter[firstName]=Ewa&filter[firstName]=Adam
  → WHERE (firstName = 'Ewa' OR firstName = 'Adam')
  ```
- **Different fields** → interpreted as `AND`:
  ```
  ?filter[firstName]=Ewa&filter[lastName]=Kowalska
  → WHERE (firstName = 'Ewa' AND lastName = 'Kowalska')
  ```
- **LIKE search** → use URL-encoded `%25` suffix:
  ```
  ?filter[lastName]=Now%25
  → WHERE lastName LIKE 'Now%'
  ```

## Advanced Filter Operators (when applicable)

| Operator | SQL Equivalent | Example |
|---|---|---|
| `eq` | `=` | `filter[status][eq]=active` |
| `neq` | `<>` | `filter[status][neq]=deleted` |
| `lt`, `lte` | `<`, `<=` | `filter[age][lt]=30` |
| `gt`, `gte` | `>`, `>=` | `filter[age][gte]=18` |
| `include` | `LIKE %val%` | `filter[name][include]=john` |
| `in` | `IN (...)` | `filter[status][in]=active,pending` |

## Response Format (Mandatory)

```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 57,
      "totalPages": 6
    },
    "filter": {
      "status": "active"
    },
    "sort": {
      "lastName": "ASC"
    },
    "search": "john"
  },
  "data": [{ "..." }]
}
```

**Rules:**
- `meta` always reflects the actual applied parameters back to the client.
- Invalid filter/sort field names are **silently ignored** (no error thrown), but not applied.
- Default `limit` should be defined in app configuration (e.g. 20 or 50).
- Maximum `limit` should be capped to prevent abuse (e.g. 100 or 250).
