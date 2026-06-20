# 04 · Update Membership — `PUT /memberships/{id}`

`PUT /api/v2/organizations/{orgSlug}/memberships/{membershipId}` → **200** → `MembershipResultDto`
Required scope: `flex.community.memberships.update`

**Updatable fields (only):** `properties`, `price`, `startDate`, `endDate`

See `00_test_plan_overview.md` for setup and shared cases.

---

## Representative requests

```bash
# Update price
curl -s -X PUT "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships/$MEMBERSHIP_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"price": 99.99}'

# Extend the term
curl -s -X PUT "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships/$MEMBERSHIP_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"endDate": "2027-06-30T00:00:00Z"}'
```

---

## Positive cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-PUT-001 | Update `price` | `{"price":99.99}` | `200`; `price` updated; `modifiedAt`↑, `modifiedBy` set |
| MB-PUT-002 | Update `startDate` | new valid date | `200`; `startDate` updated; `calculatedStatus` recalculated if it crosses now |
| MB-PUT-003 | Update `endDate` (extend) | later date | `200`; `endDate` updated |
| MB-PUT-004 | Set `endDate` on open-ended | add `endDate` to a `month_to_month` | `200`; now bounded; verify `type`/status effect |
| MB-PUT-005 | Add custom `properties` | `{"properties":{"qaTag":"updated"}}` | `200`; verify **merge vs replace** semantics and lock expectation |
| MB-PUT-006 | Update several allowed fields at once | `price`+`startDate`+`endDate` | `200`; all applied atomically |
| MB-PUT-007 | Price change updates discount math | membership with discount | `200`; `discountedPrice`/`calculatedDiscountAmount` recomputed |
| MB-PUT-008 | Idempotent re-PUT (same values) | repeat MB-PUT-001 | `200`; values stable |

---

## Negative & boundary cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-PUT-101 | Update non-existent id | random ObjectId | `404` |
| MB-PUT-102 | Empty body `{}` | `{}` | no-op `200` or `400` — lock behaviour |
| MB-PUT-103 | Negative `price` | `{"price":-1}` | `400`/`422` |
| MB-PUT-104 | `price` as string | `{"price":"free"}` | `400` |
| MB-PUT-105 | Invalid `startDate` format | `{"startDate":"31/12/2026"}` | `400` |
| MB-PUT-106 | `endDate` before `startDate` | end < start | `400`/`422` |
| MB-PUT-107 | `endDate` in the past | sets membership to expired | `200` + `calculatedStatus=expired`, or `422` — lock it |
| MB-PUT-108 | Malformed id | `/memberships/abc` | `400`/`404` |
| MB-PUT-109 | **Mass-assignment / non-updatable fields** | `{"plan":"<other>","member":"<other>","name":"hacked","_id":"x","calculatedStatus":"active","deposit":9999}` | fields ignored (unchanged) or `400`; `plan`/`member`/`_id`/`calculatedStatus` **never** change via PUT |
| MB-PUT-110 | Update a locked membership | `isLocked=true` item | blocked (`403`/`409`/`422`) — `isLocked` should prevent editing |
| MB-PUT-111 | Update a deleted membership | delete then PUT | `404` |
| MB-PUT-112 | Missing update scope | token without `...memberships.update` | `403` |
| MB-PUT-113 | Wrong `Content-Type` / malformed JSON | `text/plain` / truncated | `415`/`400` |
| MB-PUT-114 | Concurrency / lost update | two near-simultaneous PUTs | defined outcome (last-write-wins or optimistic-lock conflict); no partial/corrupt state |
| MB-PUT-115 | Injection in `properties` value | `{"properties":{"x":"{\"$set\":{}}"}}` | stored as literal string; no side effects |
| MB-PUT-116 | Unknown extra field | `{"price":10,"foo":"bar"}` | `foo` ignored or `400`; `price` still applied per spec |

---