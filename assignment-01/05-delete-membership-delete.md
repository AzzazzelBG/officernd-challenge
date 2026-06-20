# 05 · Delete Membership — `DELETE /memberships/{id}`

`DELETE /api/v2/organizations/{orgSlug}/memberships/{membershipId}` → **200** (returns the deleted `MembershipResultDto`)
Required scope: `flex.community.memberships.delete`

See `00_test_plan_overview.md` for setup and shared cases.

> Note the contract: delete returns **`200` with the deleted object**, not `204 No Content`. The body assertion is part of the positive case.

---

## Representative request

```bash
curl -s -X DELETE "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships/$MEMBERSHIP_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Positive cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-DEL-001 | Delete an existing membership | valid `_id` | `200`; body is the deleted object; `_id` matches |
| MB-DEL-002 | Resource is actually gone (GET) | delete → GET by id | subsequent GET → `404` |
| MB-DEL-003 | Removed from list | delete → list | `_id` no longer in `results` |
| MB-DEL-004 | Delete a future (`not_started`) membership | future `startDate` | `200` |
| MB-DEL-005 | Delete an `expired` membership | past `endDate` | `200` |
| MB-DEL-006 | Delete an `active` membership | current | `200` (verify allowed; see MB-DEL-104 for side effects) |

---

## Negative, boundary & business-rule cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-DEL-101 | Delete non-existent id | random ObjectId | `404` |
| MB-DEL-102 | Double delete (idempotency) | delete the same id twice | 2nd call → `404` |
| MB-DEL-103 | Malformed id | `/memberships/123` | `400`/`404` |
| MB-DEL-104 | Delete a membership with generated **invoices/charges** | seed billing, then delete | defined behaviour: blocked (`409`) **or** allowed without orphaning financial records — verify and lock; data integrity must hold |
| MB-DEL-105 | Delete a membership tied to a **contract** | `contract` set | likely blocked (`409`/`422`) — verify |
| MB-DEL-106 | Delete a **locked** membership | `isLocked=true` | blocked (`403`/`409`) — `isLocked` should prevent removal |
| MB-DEL-107 | Missing delete scope | token without `...memberships.delete` | `403` |
| MB-DEL-108 | Read-only token attempts delete | `...read` only | `403` |
| MB-DEL-109 | Injection in path id | encoded `{"$ne":null}` | `400`/`404`; **no bulk delete**, no error leakage |
| MB-DEL-110 | Concurrent delete + update | DELETE and PUT same id together | no partial state; one wins cleanly, other gets `404`/conflict |

---