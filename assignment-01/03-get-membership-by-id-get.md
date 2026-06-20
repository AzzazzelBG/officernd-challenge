# 03 · Get Membership by ID — `GET /memberships/{id}`

`GET /api/v2/organizations/{orgSlug}/memberships/{membershipId}` → **200** → `MembershipResultDto`

Required scope: `flex.community.memberships.read`

See `00_test_plan_overview.md` for setup and shared cases.

---

## Representative request

```bash
curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships/$MEMBERSHIP_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Positive cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-GETID-001 | Get an existing membership | valid `_id` from create | `200`; `_id` matches; full object returned |
| MB-GETID-002 | Field contract validation | inspect payload | every field has correct type; enums within allowed sets; dates ISO-8601 |
| MB-GETID-003 | `$select` subset | `?$select=name,price` | `200`; only selected fields (+`_id`) |
| MB-GETID-004 | Reflects a prior update | update price, then get | `200`; new `price`; `modifiedAt` > `createdAt`; `modifiedBy` set |
| MB-GETID-005 | Status fields consistent | get a future-dated membership | `calculatedStatus=not_started`; `status=approved` |
| MB-GETID-006 | `not_approved` membership | get one pending approval | `status=not_approved`; `calculatedStatus` consistent |
| MB-GETID-007 | Discount math | membership with discount | `discountedPrice` == `price` − `calculatedDiscountAmount` |

---

## Negative & boundary cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-GETID-101 | Non-existent valid-format id | random ObjectId | `404` |
| MB-GETID-102 | Malformed id | `/memberships/123` | `400`/`404` (lock it) |
| MB-GETID-103 | Trailing slash / empty id | `/memberships/` | resolves to list or `404`; not a 500 |
| MB-GETID-104 | Get a deleted membership | delete then get | `404` |
| MB-GETID-105 | Missing read scope | token without `...memberships.read` | `403` |
| MB-GETID-106 | Injection in path | `/memberships/{"$gt":""}` (encoded) | `400`/`404`; no object returned, no error leakage |
| MB-GETID-107 | Special chars / overlong id | URL-encoded junk | `400`/`404`; graceful |
| MB-GETID-108 | Case sensitivity of id | flip case of a hex id | `404` (ids are exact) |

---

## Notes

- **Tenant isolation (MB-GETID-105)** is the security keystone for a multi-tenant system: a known id from org B must be indistinguishable from a non-existent id when queried with an org-A token. A `403` that confirms existence can itself be an information leak — prefer `404`. Lock and document the actual behaviour.
- MB-GETID-002 is the contract anchor reused by the schema-validation cross-cutting case (MB-XC-012).