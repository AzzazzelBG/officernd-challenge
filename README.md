# OfficeRnD QA Challenge

[![Assignment 02 — UI Tests](https://github.com/AzzazzelBG/officernd-challenge/actions/workflows/ui-tests.yml/badge.svg)](https://github.com/AzzazzelBG/officernd-challenge/actions/workflows/ui-tests.yml)

QA challenge solution by **Aleksandar Drinkov**, split into two parts: an API
test plan and a UI automation suite.

## Repository structure

| Folder | What it is |
| --- | --- |
| [`assignment-01/`](assignment-01) | **Memberships API test plan** — written documentation covering the full CRUD surface (Create / List / Get by id / Update / Delete) with positive and negative cases. |
| [`assignment-02/`](assignment-02) | **UI automation** — an executable Playwright + TypeScript test that logs into staging and verifies the Members grid name filter. |

## Assignment 01 — API test plan

A set of Markdown documents describing functional and negative testing of the
OfficeRnD Memberships API (v2):

- `00-test-plan-overview.md` — scope, environment, and approach
- `01-create-membership-post.md` — `POST` cases
- `02-list-memberships-get.md` — `GET` (list) cases
- `03-get-membership-by-id-get.md` — `GET` (by id) cases
- `04-update-membership-put.md` — `PUT` cases
- `05-delete-membership-delete.md` — `DELETE` cases

No setup required — these are plain Markdown files you can read directly on
GitHub.

## Assignment 02 — UI automation

An automated Playwright test that:

1. Opens the OfficeRnD login page and authenticates.
2. Navigates to the **Members** page.
3. Filters by **Name: `zara`** and asserts exactly **2** results.

To run it, see [`assignment-02/README.md`](assignment-02/README.md) for setup
and commands. In short:

```bash
cd assignment-02
npm install
cp .env.example .env
npm test
```

## Continuous Integration

The UI suite runs on **GitHub Actions** ([`.github/workflows/ui-tests.yml`](.github/workflows/ui-tests.yml)).

- The workflow is **scoped to `assignment-02/`** — it only runs when files in
  that folder (or the workflow itself) change, so edits to the API test plan or
  this README never trigger a browser run.
- It runs inside the official `mcr.microsoft.com/playwright` container, pinned to
  the same Playwright version the suite is locked to.
- Credentials are injected from repository **secrets** (`BASE_URL`, `ORG_SLUG`,
  `USER_EMAIL`, `USER_PASSWORD`) — never from the committed `.env.example`.
- The HTML report (with traces/screenshots/videos on failure) is uploaded as a
  build artifact, and a reviewer can trigger a run manually via **Run workflow**.

> Note: the suite exercises live OfficeRnD **staging**, so a run also depends on
> that environment and the configured credentials being available.
