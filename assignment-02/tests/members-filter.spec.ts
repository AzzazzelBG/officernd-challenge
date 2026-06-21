import { test, expect } from '../src/fixtures/test-fixtures';

const FILTER_TERM = 'zara';
const EXPECTED_RESULTS = 2;

test.describe('Members grid – filter by Name', () => {
  test(`filtering members by "${FILTER_TERM}" shows exactly ${EXPECTED_RESULTS} results`, async ({
    appConfig,
    loginPage,
    membersPage,
  }) => {
    await test.step('Log in as the automation user', async () => {
      await loginPage.goto();
      await loginPage.login(appConfig.email, appConfig.password);
    });

    await test.step('Open the Members page', async () => {
      await membersPage.goto();
    });

    await test.step(`Filter by Name "${FILTER_TERM}"`, async () => {
      await membersPage.filterByName(FILTER_TERM);
    });

    await test.step(`Validate exactly ${EXPECTED_RESULTS} results are displayed`, async () => {
      await expect(membersPage.resultRows).toHaveCount(EXPECTED_RESULTS);
    });
  });
});
