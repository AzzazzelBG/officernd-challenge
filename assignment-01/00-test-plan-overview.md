# Memberships API — Test Plan Overview

**Author:** Aleksandar Drinkov

**System under test:** OfficeRnD Memberships API

**Environment:** Staging

**API version targeted:** v2

**Docs:** https://developer.officernd.com/reference/memberships

---

## 1. Purpose & scope

This plan covers functional and negative testing of the full Memberships CRUD surface:

| Operation | Method & path | Success |
|---|---|---|
| Create | `POST /api/v2/organizations/{orgSlug}/memberships` | `201` |
| List | `GET /api/v2/organizations/{orgSlug}/memberships` | `200` |
| Get by id | `GET /api/v2/organizations/{orgSlug}/memberships/{id}` | `200` |
| Update by id | `PUT /api/v2/organizations/{orgSlug}/memberships/{id}` | `200` |
| Delete by id | `DELETE /api/v2/organizations/{orgSlug}/memberships/{id}` | `200` (returns the deleted object) |

---

## 2. Environment & configuration

Use environment variables so the suite is portable between staging and production.

```bash
export IDENTITY_URL="https://identity-staging.officernd.com"
export BASE_URL="https://staging.officernd.com"                    
export ORG_SLUG="adrinkov-qa-task"                   
export CLIENT_ID="CZDkpEcSlhsnlDtY"
export CLIENT_SECRET="0F67JuedQ8YjtgSNn3h4zes5qZfkuFhu"
```

---

## 3. Authentication & token retrieval

OAuth 2.0 **client-credentials** flow. A token is a Bearer token valid ~3599 s (~1 hour).

```bash
# v2 token (granular scopes, space-separated)
export TOKEN=$(curl -s -X POST "$IDENTITY_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&grant_type=client_credentials&scope=flex.community.memberships.read flex.community.memberships.create flex.community.memberships.update flex.community.memberships.delete flex.community.companies.read flex.community.companies.create flex.billing.plans.read flex.space.locations.read" \
  | jq -r '.access_token')

echo "$TOKEN"
```

Every API request then carries: `Authorization: Bearer $TOKEN`.

---

## 4. Required scope per operation (auth matrix)

| Operation | Required scope |
|---|---|
| Create | `flex.community.memberships.create` |
| List / Get by id | `flex.community.memberships.read` |
| Update | `flex.community.memberships.update` |
| Delete | `flex.community.memberships.delete` |

Each method file includes a "wrong/missing scope → 403" case; the broader auth cases (no token, bad token, expired token, wrong org) are shared and listed in §7.

---

## 5. Test data preparation

Memberships require a valid `location` and `plan`. Neither is creatable via the API (both are read-only), so **fetch** existing IDs; **create** a throwaway member and company for assignment tests.

```bash
# Grab a location id
export LOCATION_ID=$(curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/locations?\$limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[0]._id')

# Grab a plan id
export PLAN_ID=$(curl -s "$BASE_URL/api/v2/organizations/$ORG_SLUG/plans?\$limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[0]._id')

# Create a test company
export COMPANY_ID=$(curl -s -X POST "$BASE_URL/api/v2/organizations/$ORG_SLUG/companies" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"QA Test Co (delete me)"}' | jq -r '._id')

# Create a test member tied to that company
export MEMBER_ID=$(curl -s -X POST "$BASE_URL/api/v2/organizations/$ORG_SLUG/members" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"QA Test Member\",\"email\":\"qa.test+$(date +%s)@example.com\",\"company\":\"$COMPANY_ID\"}" | jq -r '._id')
```

**Cleanup:** delete every membership created during a run, then the test member and company, to keep staging clean and tests repeatable. Prefer unique markers (e.g. `name` prefixed `QA-` + timestamp) so leftovers are easy to find.

---

## 6. Conventions

- **Case ID:** `MB-<METHOD>-NNN` (e.g. `MB-POST-001`, `MB-GETID-004`).
- **Priority:** P1 (critical path / data integrity / security) · P2 (important) · P3 (nice-to-have / cosmetic).
- **Expected status legend:** ranges like `400/422` mean "client error expected; confirm exact code on staging and lock it in as the assertion." Lock real codes after the first run — that itself is a finding if the docs and behaviour disagree.

**Data model (key fields):**

- *Required on create:* `name`, `startDate`, `location`, `plan`.
- *Optional:* `member`, `company`, `isPersonal`, `type` (`month_to_month` | `fixed`), `intervalLength` (`once`|`hour`|`day`|`month`), `price`, `deposit`, `properties`.
- *`type=fixed`* requires `endDate`.
- *Updatable on PUT (only):* `properties`, `price`, `startDate`, `endDate`. Anything else should be ignored or rejected — a key contract check.
- *Read-only / system:* `_id`, `status` (`approved`|`not_approved`), `calculatedStatus` (`not_started`|`active`|`expired`|`not_approved`), `discountedPrice`, `calculatedDiscountAmount`, `source`, `createdAt/By`, `modifiedAt/By`, `isLocked`.

---

## 7. Cross-cutting cases (apply to every method)

These are run once per method (or parameterised across all) rather than duplicated in each file.

| ID | Title | Expected |
|---|---|---|
| MB-XC-001 | No `Authorization` header | `401` |
| MB-XC-002 | Malformed / garbage Bearer token | `401` |
| MB-XC-003 | Expired token | `401` |
| MB-XC-004 | Valid token, missing the operation's scope | `403` (confirm vs `401`) |
| MB-XC-005 | Token for organization A used against org B's slug (tenant isolation) | `403`/`404`, no data leak |
| MB-XC-006 | Unknown `orgSlug` | `404` |
| MB-XC-007 | Unsupported `Content-Type` on write (e.g. `text/plain`) | `415`/`400` |
| MB-XC-008 | Malformed JSON body on write | `400` |
| MB-XC-009 | Unsupported HTTP method on path (e.g. `PATCH` collection) | `405` |
| MB-XC-010 | Rate limiting — burst beyond the v2 limit | `429` with retry metadata |
| MB-XC-011 | Plain HTTP instead of HTTPS | rejected / redirected to HTTPS |
| MB-XC-012 | Response contract: every field type/enum matches the documented schema | schema validation passes |
| MB-XC-013 | Latency within agreed SLA under nominal load | within threshold |

---
