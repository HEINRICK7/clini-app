import { api, assertNoHorizontalOverflow, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma avançado salva achados por superfície no prontuário e restaura após recarregar", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const route = `/more?section=odontogram&patientId=${fixture.patientId}`;
  await page.goto(route);
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();
  await expect(page.locator(".clini-advanced-chart-library .topbar")).toBeHidden();
  await expect(page.getByText("React Advanced Odontogram", { exact: false })).toBeHidden();

  const tooth16 = page.locator('[role="option"][aria-label*="16"]').first();
  await expect(tooth16).toBeVisible();
  await tooth16.click();
  await expect(tooth16).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#activeToothLabel")).toContainText("16");
  const occlusalSurface = page.locator("#chk-caries-occlusal");
  await expect(occlusalSurface).toBeVisible();
  await page.locator(".clini-advanced-chart-library label.surface-cell.pos-occlusal")
    .filter({ has: occlusalSurface })
    .click();
  await expect(occlusalSurface).toBeChecked();
  await expect(page.getByTestId("save-advanced-odontogram")).toBeEnabled();

  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoHorizontalOverflow(page);
    const chartLayout = await page.evaluate(() => {
      const chart = document.querySelector<HTMLElement>(".clini-advanced-chart-library .chart");
      const grid = document.querySelector<HTMLElement>(".clini-advanced-chart-library #toothGrid");
      const chartModeButton = document.querySelector<HTMLElement>(".clini-advanced-chart-library .chart-mode-btn");
      return {
        chartWidth: chart?.getBoundingClientRect().width ?? 0,
        gridClientWidth: grid?.clientWidth ?? 0,
        gridScrollWidth: grid?.scrollWidth ?? 0,
        chartModeButtonHeight: chartModeButton?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(chartLayout.chartWidth, `cartão do odontograma deve caber em ${width}px`).toBeLessThanOrEqual(width + 1);
    if (width <= 414) {
      expect(chartLayout.chartModeButtonHeight).toBeGreaterThanOrEqual(44);
      const toolbarButtons = page.locator(".clini-advanced-chart-library .perio-launch-bar button");
      await expect(toolbarButtons).toHaveCount(3);
      const controlsFit = await page.locator(".clini-advanced-chart-library .perio-launch-bar").evaluate((toolbar) => {
        const bounds = toolbar.getBoundingClientRect();
        return Array.from(toolbar.querySelectorAll("button")).every((button) => {
          const buttonBounds = button.getBoundingClientRect();
          return buttonBounds.height >= 44 && buttonBounds.left >= bounds.left && buttonBounds.right <= bounds.right;
        });
      });
      expect(controlsFit, `controles clínicos devem caber em ${width}px`).toBe(true);
    }
    if (width === 320) {
      expect(chartLayout.gridScrollWidth).toBeGreaterThan(chartLayout.gridClientWidth);
    }
  }

  await page.getByTestId("save-advanced-odontogram").click();
  await expect(page.getByTestId("odontogram-save-state")).toHaveText("Tudo salvo");
  const firstSave = expectStatus(await api<{
    version: number;
    chartPayload: { format: string; statusChart: { teeth: Record<string, unknown> } };
  }>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(firstSave.version).toBe(1);
  expect(firstSave.chartPayload.format).toBe("clini-advanced-odontogram");
  expect(firstSave.chartPayload.statusChart.teeth["16"]).toBeTruthy();

  await page.reload();
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /oclusal/i }).first()).toBeChecked();
  const afterReload = expectStatus(await api<typeof firstSave>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(afterReload.chartPayload).toEqual(firstSave.chartPayload);
});
