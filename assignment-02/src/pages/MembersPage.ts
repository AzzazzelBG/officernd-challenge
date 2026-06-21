import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MembersPage extends BasePage {

  readonly grid: Locator;
  readonly activeFilters: Locator;

  private readonly nameColumnMenu: Locator;
  private readonly nameFilterInput: Locator;
  private readonly applyFilterButton: Locator;

  constructor(
    page: Page,
    private readonly orgSlug: string,
  ) {
    super(page);
    this.grid = page.getByRole('grid', { name: 'Table' });
    this.activeFilters = page.getByRole('paragraph').filter({ hasText: 'Active Filters:' });
    this.nameColumnMenu = page.getByRole('link', { name: 'Name Column menu' });
    this.nameFilterInput = page.getByRole('textbox', { name: 'Name', exact: true });
    this.applyFilterButton = page.getByRole('button', { name: 'Filter', exact: true });
  }

  async goto(): Promise<void> {
    await this.open(`/admin/${this.orgSlug}/operations/members`);
    await expect(this.grid).toBeVisible();
    await expect(this.resultRows.first()).toBeVisible();
  }

  async filterByName(name: string): Promise<void> {
    await this.nameColumnMenu.click();
    await expect(this.nameFilterInput).toBeVisible();
    await this.nameFilterInput.fill(name);
    await this.applyFilterButton.click();

    await this.page.waitForURL(/[?&]name=/);
    await expect(this.activeFilters).toContainText(`Name (${name})`);
  }

  get resultRows(): Locator {
    return this.grid.getByRole('rowgroup').nth(1).getByRole('row');
  }
}
