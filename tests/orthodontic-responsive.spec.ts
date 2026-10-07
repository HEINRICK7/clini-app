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
  const orthodonticAppliance = page.locator("#orthoApplianceSelect");
  await expect(orthodonticAppliance).toBeVisible();
  await orthodonticAppliance.selectOption("bracket");
  await page.locator('[role="option"][aria-label*="17"]').first().click();
  await page.locator("#orthoApplianceSelect").selectOption("bracket");
  await expect(page.getByTestId("orthodontic-wire")).toBeVisible();
  await expect(page.getByTestId("save-advanced-odontogram")).toBeEnabled();

  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoHorizontalOverflow(page);
    const chartLayout = await page.evaluate(() => {
      const chart = document.querySelector<HTMLElement>(".clini-advanced-chart-library .chart");
      const grid = document.querySelector<HTMLElement>(".clini-advanced-chart-library #toothGrid");
      const chartModeButton = document.querySelector<HTMLElement>(".clini-advanced-chart-library .chart-mode-btn");
      const layout = document.querySelector<HTMLElement>(".clini-advanced-chart-library .layout");
      const controls = document.querySelector<HTMLElement>(".clini-advanced-chart-library .panel");
      const controlsBody = document.querySelector<HTMLElement>(".clini-advanced-chart-library .panel-body");
      const layoutBounds = layout?.getBoundingClientRect();
      const controlsBounds = controls?.getBoundingClientRect();
      return {
        chartWidth: chart?.getBoundingClientRect().width ?? 0,
        gridClientWidth: grid?.clientWidth ?? 0,
        gridScrollWidth: grid?.scrollWidth ?? 0,
        chartModeButtonHeight: chartModeButton?.getBoundingClientRect().height ?? 0,
        layoutColumnCount: layout ? getComputedStyle(layout).gridTemplateColumns.split(" ").length : 0,
        controlsBodyMaxHeight: controlsBody ? getComputedStyle(controlsBody).maxHeight : "missing",
        controlsBodyOverflowY: controlsBody ? getComputedStyle(controlsBody).overflowY : "missing",
        controlsFitLayout: Boolean(layoutBounds && controlsBounds
          && controlsBounds.left >= layoutBounds.left
          && controlsBounds.right <= layoutBounds.right + 1),
      };
    });
    expect(chartLayout.chartWidth, `cartão do odontograma deve caber em ${width}px`).toBeLessThanOrEqual(width + 1);
    if (width < 1024) {
      expect(chartLayout.layoutColumnCount, `odontograma deve empilhar mapa e controles em ${width}px`).toBe(1);
      expect(chartLayout.controlsFitLayout, `controles devem ocupar a largura disponível em ${width}px`).toBe(true);
    }
    if (width <= 414) {
      expect(chartLayout.controlsBodyMaxHeight, `controles não devem ser cortados em ${width}px`).toBe("none");
      expect(chartLayout.controlsBodyOverflowY, `controles devem acompanhar a rolagem da página em ${width}px`).toBe("visible");
      const pageScroll = await page.evaluate(() => {
        const scroller = document.scrollingElement;
        if (!scroller) return { canScroll: false, panelBottomVisible: false };
        scroller.scrollTop = scroller.scrollHeight;
        const panel = document.querySelector<HTMLElement>(".clini-advanced-chart-library .panel");
        const navigation = document.querySelector<HTMLElement>('nav[aria-label="Navegação principal"]');
        return {
          canScroll: scroller.scrollHeight > window.innerHeight && scroller.scrollTop > 0,
          bodyGrowsWithContent: document.body.getBoundingClientRect().height > window.innerHeight,
          panelBottomVisible: Boolean(panel && navigation
            && panel.getBoundingClientRect().bottom <= navigation.getBoundingClientRect().top),
        };
      });
      expect(pageScroll.canScroll, `a tela deve rolar para mostrar o restante em ${width}px`).toBe(true);
      expect(pageScroll.bodyGrowsWithContent, `a página deve crescer com o conteúdo em ${width}px`).toBe(true);
      expect(pageScroll.panelBottomVisible, `o fim dos controles deve ser alcançável pela rolagem da tela em ${width}px`).toBe(true);
    }
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
    chartPayload: { format: string; statusChart: { teeth: Record<string, { orthoAppliance?: string }> } };
  }>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(firstSave.version).toBe(1);
  expect(firstSave.chartPayload.format).toBe("clini-advanced-odontogram");
  expect(firstSave.chartPayload.statusChart.teeth["16"]).toBeTruthy();
  expect(firstSave.chartPayload.statusChart.teeth["16"]?.orthoAppliance).toBe("bracket");
  expect(firstSave.chartPayload.statusChart.teeth["17"]?.orthoAppliance).toBe("bracket");

  await page.reload();
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();
  await page.locator('[role="option"][aria-label*="16"]').first().click();
  await expect(page.getByRole("checkbox", { name: /oclusal/i }).first()).toBeChecked();
  await expect(page.locator("#orthoApplianceSelect")).toHaveValue("bracket");
  await page.locator('[role="option"][aria-label*="17"]').first().click();
  await expect(page.getByTestId("orthodontic-wire")).toBeVisible();
  const afterReload = expectStatus(await api<typeof firstSave>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(afterReload.chartPayload).toEqual(firstSave.chartPayload);
});

test("tratamento ortodôntico abre o odontograma do paciente e salva marcação por dente", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);

  await page.goto(`/more?section=treatments&patientId=${fixture.patientId}`);
  await page.getByLabel("Tipo de tratamento").selectOption("ORTHODONTIC");
  await page.getByLabel("Tipo de aparelho").selectOption("FIXED");
  await page.getByLabel("Nome do tratamento").fill(`Ortodontia E2E ${Date.now()}`);
  await page.getByRole("button", { name: "Criar tratamento" }).click();
  await expect(page.getByText("Tratamento criado como planejado.")).toBeVisible();
  await expect(page.getByText("Aparelho fixo", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Abrir odontograma clínico" }).click();
  await expect(page).toHaveURL(new RegExp(`/more\\?section=odontogram&patientId=${fixture.patientId}`));
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();
  await page.locator('[role="option"][aria-label*="16"]').first().click();
  const appliance = page.locator("#orthoApplianceSelect");
  await expect(appliance).toBeVisible();
  await appliance.selectOption("bracket");
  await page.locator('[role="option"][aria-label*="17"]').first().click();
  await page.locator("#orthoApplianceSelect").selectOption("bracket");
  await expect(page.getByTestId("orthodontic-wire")).toBeVisible();
  await page.getByTestId("save-advanced-odontogram").click();
  await expect(page.getByTestId("odontogram-save-state")).toHaveText("Tudo salvo");

  const saved = expectStatus(await api<{
    chartPayload: { statusChart: { teeth: Record<string, { orthoAppliance?: string }> } };
  }>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(saved.chartPayload.statusChart.teeth["16"]?.orthoAppliance).toBe("bracket");
  expect(saved.chartPayload.statusChart.teeth["17"]?.orthoAppliance).toBe("bracket");
});
