# 02 · List Memberships — `GET /memberships`

`GET /api/v2/organizations/{orgSlug}/memberships` → **200**

Required scope: `flex.community.memberships.read`

Response envelope: `{ results[], cursorNext, cursorPrev, rangeStart, rangeEnd }`

Filters: `_id` (+`[$in]`), `company`, `member`, `calculatedStatus`, `location`, `createdAt`/`modifiedAt` (`$gt/$gte/$lt/$lte`), `properties[...]`, `$select`, `$limit`, `$cursorNext`, `$cursorPrev`

See `00_test_plan_overview.md` for setup and shared cases.

---

## Representative requests

```bash
# All (first page)
curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships" -H "Authorization: Bearer $TOKEN"

# Filter by member + active status, 1 per page
curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships?member=$MEMBER_ID&calculatedStatus=active&\$limit=1" \
  -H "Authorization: Bearer $TOKEN"

# Multiple ids
curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships?_id\[\$in\]=$ID1,$ID2" \
  -H "Authorization: Bearer $TOKEN"

# Date range
curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships?createdAt\[\$gte\]=2026-01-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Positive cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-LIST-001 | List all (first page) | no params | `200`; `results` array; envelope has `cursorNext`, `cursorPrev` (null on page 1), `rangeStart/rangeEnd` |
| MB-LIST-002 | Filter by `member` | `member=$MEMBER_ID` | `200`; every result's `member` == filter |
| MB-LIST-003 | Filter by `company` | `company=$COMPANY_ID` | `200`; every result's `company` == filter |
| MB-LIST-004 | Filter by `location` | `location=$LOCATION_ID` | `200`; all match |
| MB-LIST-005 | Filter by `calculatedStatus=active` | `calculatedStatus=active` | `200`; all `active` |
| MB-LIST-006 | Filter by each status enum | `not_started`/`expired`/`not_approved` | `200`; correct subset each |
| MB-LIST-007 | Filter by single `_id` | `_id=<id>` | `200`; exactly that one |
| MB-LIST-008 | Filter by `_id[$in]` list | two ids | `200`; both returned |
| MB-LIST-009 | `createdAt[$gte]` range | recent timestamp | `200`; only items on/after the date |
| MB-LIST-010 | `modifiedAt[$gte]` after an update | update one first | `200`; includes the just-updated item |
| MB-LIST-011 | `properties[qaTag]=regression` | custom prop filter | `200`; only matching items |
| MB-LIST-012 | `$select` subset | `$select=name,plan` | `200`; results contain only selected fields (+`_id`) |
| MB-LIST-013 | `$limit=1` paging | `$limit=1` | `200`; ≤1 result; `cursorNext` present when more exist |
| MB-LIST-014 | Walk forward with `cursorNext` | use returned token | `200`; next page; no overlap with page 1 |
| MB-LIST-015 | Walk back with `cursorPrev` | from page 2 | `200`; returns page-1 contents |
| MB-LIST-016 | Default page size | omit `$limit`, >50 items exist | `200`; ≤50 results |
| MB-LIST-017 | `$limit` above max | `$limit=1000` | `200`; capped at 50 |
| MB-LIST-018 | Empty result set | filter matches nothing (`member=<unused valid id>`) | `200`; `results: []`; valid envelope |
| MB-LIST-019 | Combined filters | `member` + `calculatedStatus` | `200`; satisfies both (AND) |
| MB-LIST-020 | Created membership appears | create then list | new `_id` present |

---

## Negative & boundary cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-LIST-101 | Invalid `calculatedStatus` enum | `calculatedStatus=foo` | `400` (or empty — lock behavior) |
| MB-LIST-102 | Invalid date format in filter | `createdAt[$gte]=yesterday` | `400` |
| MB-LIST-103 | `$limit=0` | `$limit=0` | defined behavior: `400` or empty page (lock it) |
| MB-LIST-104 | Negative `$limit` | `$limit=-5` | `400` |
| MB-LIST-105 | Non-numeric `$limit` | `$limit=abc` | `400` |
| MB-LIST-106 | Invalid / tampered cursor | `$cursorNext=garbage` | `400` |
| MB-LIST-107 | Non-existent (valid-format) `member` filter | random ObjectId | `200`; `results: []` |
| MB-LIST-108 | Malformed `_id` value | `_id=123` | `400` or empty (lock it) |
| MB-LIST-109 | `properties` non-string value | `properties[x]=5` | `400`/ignored (docs: only strings) |
| MB-LIST-110 | Very large `$in` list | hundreds of ids | graceful handling; no timeout/500 |
| MB-LIST-111 | Injection in filter value | `member={"$ne":null}` | treated literally; no mass dump; `400`/empty |
| MB-LIST-112 | Tenant isolation | list with org-B token but org-A slug | `403`/`404`; never returns org-A data |
| MB-LIST-113 | Missing read scope | token without `...memberships.read` | `403` |
| MB-LIST-114 | Pagination integrity | walk all pages to `cursorNext=null` | union has no duplicates and no skipped items; stable order |
| MB-LIST-115 | `$populate` (v2 removed) | `$populate=member` | `400`/ignored (v1 delta: in v1 this expands the ref) |

---