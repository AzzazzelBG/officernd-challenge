# 01 · Create Membership — `POST /memberships`

`POST /api/v2/organizations/{orgSlug}/memberships` → **201** · 

`AddMembershipDto` → `MembershipResultDto`

Required scope: `flex.community.memberships.create`

Required fields: `name`, `startDate`, `location`, `plan`

See `00_test_plan_overview.md` for setup, auth, data prep, and shared cross-cutting cases (`MB-XC-*`).

---

## Representative requests

**Minimal valid create:**
```bash
curl -s -X POST "$BASE_URL/api/v2/organizations/$ORG_SLUG/memberships" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{
    \"name\": \"QA-Smart-$(date +%s)\",
    \"startDate\": \"2026-07-01T00:00:00Z\",
    \"location\": \"$LOCATION_ID\",
    \"plan\": \"$PLAN_ID\"
  }"
```

**Full personal, fixed-term create:**
```json
{
  "name": "QA-Total-Fixed",
  "startDate": "2026-07-01T00:00:00Z",
  "endDate": "2026-12-31T00:00:00Z",
  "location": "<LOCATION_ID>",
  "plan": "<PLAN_ID>",
  "member": "<MEMBER_ID>",
  "isPersonal": true,
  "type": "fixed",
  "intervalLength": "month",
  "price": 120.5,
  "deposit": 200,
  "properties": { "qaTag": "regression" }
}
```

---

## Positive cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-POST-001 | Create with only the 4 required fields | minimal body above | `201`; body is a `MembershipResultDto`; `_id` present; echoes `name/startDate/location/plan`; `status=approved`; `source`, `createdAt`, `createdBy` populated |
| MB-POST-002 | Create assigned to a member, `isPersonal=true` | add `member`, `isPersonal:true` | `201`; `member` set; `isPersonal=true` (billed to member) |
| MB-POST-003 | Create assigned to a company | add `company` | `201`; `company` set |
| MB-POST-004 | `month_to_month` without `endDate` (open-ended) | `type:"month_to_month"`, no `endDate` | `201`; `endDate` empty/null |
| MB-POST-005 | `fixed` with valid `endDate` | `type:"fixed"`, `endDate` after `startDate` | `201`; `type=fixed`; `endDate` stored |
| MB-POST-006 | Price + deposit persisted | `price:120.5`, `deposit:200` | `201`; values reflected; `discountedPrice` computed |
| MB-POST-007 | Each valid `intervalLength` enum | `once` / `hour` / `day` / `month` (one per run) | `201` for each |
| MB-POST-008 | Custom `properties` echoed | `properties:{qaTag:"x"}` | `201`; `properties` returned intact |
| MB-POST-009 | Future `startDate` → status | `startDate` in the future | `201`; `calculatedStatus=not_started` |
| MB-POST-010 | `startDate` today/past, open-ended | `startDate` ≤ now | `201`; `calculatedStatus=active` |
| MB-POST-011 | `fixed` already ended | `endDate` in the past | `201`; `calculatedStatus=expired` (verify) |
| MB-POST-012 | Unicode / emoji in `name` | `name:"QA-名前"` | `201`; stored and returned correctly |
| MB-POST-013 | Audit fields | any valid create | `createdAt≈now`, `createdBy`=token's user, `modifiedAt`==`createdAt` initially |

---

## Negative & boundary cases

| ID | Title | Steps / data | Expected |
|---|---|---|---|
| MB-POST-101 | Missing `name` | omit `name` | `400`; error names the missing field |
| MB-POST-102 | Missing `startDate` | omit `startDate` | `400` |
| MB-POST-103 | Missing `location` | omit `location` | `400` |
| MB-POST-104 | Missing `plan` | omit `plan` | `400` |
| MB-POST-105 | Empty body `{}` | `{}` | `400`; reports all missing required fields |
| MB-POST-106 | `fixed` without `endDate` | `type:"fixed"`, no `endDate` | `400`/`422` (end date required for fixed) |
| MB-POST-107 | Invalid `type` enum | `type:"weekly"` | `400` |
| MB-POST-108 | Invalid `intervalLength` enum | `intervalLength:"year"` | `400` |
| MB-POST-109 | Non-existent `plan` id (valid format) | random ObjectId | `400`/`404`/`422`; referential integrity enforced |
| MB-POST-110 | Non-existent `location` id | random ObjectId | `400`/`404`/`422` |
| MB-POST-111 | Non-existent `member` id | random ObjectId | `400`/`422` |
| MB-POST-112 | Non-existent `company` id | random ObjectId | `400`/`422` |
| MB-POST-113 | `plan`/`location` belonging to a **different org** | cross-tenant id | `400`/`404`; no cross-tenant linking |
| MB-POST-114 | `endDate` before `startDate` | end < start | `400`/`422` |
| MB-POST-115 | Negative `price` | `price:-10` | `400`/`422` |
| MB-POST-116 | Negative `deposit` | `deposit:-5` | `400`/`422` |
| MB-POST-117 | `price` as string | `price:"abc"` | `400` (type) |
| MB-POST-118 | `isPersonal` as string | `isPersonal:"yes"` | `400` (type) |
| MB-POST-119 | Invalid `startDate` format | `startDate:"01-07-2026"` / `"not-a-date"` | `400` |
| MB-POST-120 | Empty-string `name` | `name:""` | `400`/`422` |
| MB-POST-121 | Very long `name` (boundary) | name at/over max length | `400`/`422` at over-limit; `201` at limit |
| MB-POST-122 | Unknown/extra field (mass-assignment) | add `calculatedStatus:"active"`, `_id:"x"`, `discountedPrice:0` | ignored (server-computed), or `400`; never lets caller set read-only fields |
| MB-POST-123 | Neither `member` nor `company` | omit both | verify: is an unassigned membership allowed? Lock expectation |
| MB-POST-124 | `member` not in provided `company` | mismatched pair | `400`/`422` |
| MB-POST-125 | NoSQL/SQL injection in `name` | `name:"{\"$gt\":\"\"}"` / `"' OR 1=1 --"` | treated as literal string; `201` or `400`; no injection effect |
| MB-POST-126 | XSS payload in `name` | `name:"<script>alert(1)</script>"` | stored/escaped; returned safely |
| MB-POST-127 | Wrong `Content-Type` | `text/plain` body | `415`/`400` (ref MB-XC-007) |
| MB-POST-128 | Malformed JSON | truncated JSON | `400` (ref MB-XC-008) |
| MB-POST-129 | Missing `...memberships.create` scope | read-only token | `403` |
| MB-POST-130 | Duplicate create (same name+member+plan) | repeat MB-POST-002 | verify whether duplicates are allowed; lock expectation |

---