# OfficeRnD — UI Automation (Assignment 02)

Automated UI test built with **Playwright** and **TypeScript** that verifies the
Members grid name filter:

1. Navigate to the OfficeRnD staging login page.
2. Log in as the automation user.
3. Open the **Members** page (Operations).
4. Apply a filter by **Name: `zara`**.
5. Validate that **exactly 2** results are displayed in the grid.

## Tech stack

- [Playwright Test](https://playwright.dev/)
- TypeScript

## Prerequisites

- **Node.js 18+**
- npm

## Setup

```bash
# from this directory (assignment-02)
npm install            # installs dependencies + the Chromium browser (postinstall)
cp .env.example .env   # create your local env file
```

`.env.example` is pre-filled with the staging credentials from the assignment,
so the suite runs out of the box once copied to `.env`. `.env` is gitignored and
never committed.

> If `npm install` does not download the browser automatically, run:
> `npx playwright install chromium`

## Running the test

```bash
npm test               # headless run
npm run test:headed    # watch it run in a real browser
npm run test:ui        # interactive Playwright UI mode
npm run test:debug     # step-through debugger
npm run report         # open the HTML report from the last run
```

## Configuration

All environment-specific values are read from `.env` (see `src/config/env.ts`),
so the same suite can target a different environment, organization, or user
without code changes:

| Variable        | Description                              | Default                          |
| --------------- | ---------------------------------------- | -------------------------------- |
| `BASE_URL`      | Base URL of the environment under test   | `https://staging.officernd.com`  |
| `ORG_SLUG`      | Organization slug used in `/admin/...`   | `adrinkov-qa-task`               |
| `USER_EMAIL`    | Login email for the automation user      | _(required)_                     |
| `USER_PASSWORD` | Login password for the automation user   | _(required)_                     |

## Project structure

```
assignment-02/
├── playwright.config.ts        # runner config (baseURL, reporters, projects)
├── tsconfig.json
├── .env.example                # template for local credentials
├── src/
│   ├── config/
│   │   └── env.ts              # typed, validated environment configuration
│   ├── fixtures/
│   │   └── test-fixtures.ts    # injects page objects + config into tests
│   └── pages/                  # Page Object Model
│       ├── BasePage.ts
│       ├── LoginPage.ts        # two-step login flow
│       └── MembersPage.ts      # members grid + Name column filter
└── tests/
    └── members-filter.spec.ts  # the scenario
```
