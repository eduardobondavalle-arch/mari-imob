import { test, expect } from "@playwright/test";
test("V2: filtros, Kanban, comentários, agenda e seleção compartilhada", async ({
  page,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const unique = `Interface ${info.project.name} ${Date.now()}`,
    phone = `479${String(Date.now()).slice(-8)}`,
    headers = { origin: baseURL! };
  let leadId = "",
    stageId = "";
  const appointmentIds: string[] = [];
  await page.goto("/admin/login");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(process.env.TEST_ADMIN_EMAIL || "mari@admin.com.br");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD || "Admin");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const initial = (
    await (await page.request.get("/api/admin/board")).json()
  ).find((s: { isDefault: boolean }) => s.isDefault);
  try {
    await page.goto("/admin?tab=leads");
    await page
      .getByRole("button", { name: "Novo interessado", exact: true })
      .click();
    let dialog = page.getByRole("dialog", {
      name: "Novo interessado",
      exact: true,
    });
    await dialog.getByLabel("Primeiro nome").fill(unique);
    await dialog.getByLabel("Telefone com DDD").fill(phone);
    await dialog
      .getByLabel("Observação inicial")
      .fill("Observação privada da verificação visual.");
    await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
    dialog = page.getByRole("dialog", {
      name: "Detalhes do interessado",
      exact: true,
    });
    await expect(
      dialog.getByText("Observação privada da verificação visual.", {
        exact: true,
      }),
    ).toBeVisible();
    leadId = (
      await (await page.request.get(`/api/admin/leads?q=${phone}`)).json()
    )[0].id;
    await dialog
      .getByLabel("Anotação", { exact: true })
      .fill(`Anotação ${unique}`);
    await dialog.getByRole("button", { name: "Adicionar comentário" }).click();
    await expect(
      dialog.getByText(`Anotação ${unique}`, { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Novo compromisso", exact: true })
      .click();
    let appointment = page.getByRole("dialog", {
      name: "Novo compromisso",
      exact: true,
    });
    await appointment.getByLabel("Título", { exact: true }).fill(unique);
    await appointment
      .getByLabel("Início", { exact: true })
      .fill("2026-10-19T14:00");
    await appointment
      .getByLabel("Término", { exact: true })
      .fill("2026-10-19T15:00");
    await appointment
      .getByRole("button", { name: "Salvar compromisso" })
      .click();
    await expect(appointment).not.toBeVisible();
    appointmentIds.push(
      ...(
        await (
          await page.request.get(`/api/admin/appointments?leadId=${leadId}`)
        ).json()
      ).map((e: { id: string }) => e.id),
    );
    await expect(dialog.locator(".calendar-event")).toHaveCount(1);
    await dialog
      .getByRole("button", { name: "Novo compromisso", exact: true })
      .click();
    appointment = page.getByRole("dialog", {
      name: "Novo compromisso",
      exact: true,
    });
    await appointment
      .getByLabel("Título", { exact: true })
      .fill(`Sobreposição ${unique}`);
    await appointment
      .getByLabel("Início", { exact: true })
      .fill("2026-10-19T14:30");
    await appointment
      .getByLabel("Término", { exact: true })
      .fill("2026-10-19T15:30");
    await appointment
      .getByRole("button", { name: "Salvar compromisso" })
      .click();
    await expect(
      appointment.getByText("Conflito de horário identificado", {
        exact: true,
      }),
    ).toBeVisible();
    await appointment
      .getByRole("button", { name: "Agendar mesmo assim" })
      .click();
    await expect(appointment).not.toBeVisible();
    const events = await (
      await page.request.get(`/api/admin/appointments?leadId=${leadId}`)
    ).json();
    for (const event of events)
      if (!appointmentIds.includes(event.id)) appointmentIds.push(event.id);
    await dialog
      .getByRole("button", { name: "Criar seleção", exact: true })
      .click();
    const selection = page.getByRole("dialog", {
      name: "Nova seleção",
      exact: true,
    });
    await selection
      .getByLabel("Título público da seleção")
      .fill(`Curadoria ${unique}`);
    await selection
      .locator('.property-picker input[type="checkbox"]')
      .first()
      .check();
    await selection
      .locator('.property-picker input[type="checkbox"]')
      .nth(1)
      .check();
    await selection
      .getByRole("button", { name: "Salvar seleção", exact: true })
      .click();
    await expect(selection).not.toBeVisible();
    const extras = await (
      await page.request.get(`/api/admin/lead-extras/${leadId}`)
    ).json();
    const token = extras.selections.find(
      (s: { origin: string }) => s.origin === "admin",
    ).publicToken;
    await page.screenshot({
      path: `docs/mari/v2-lead-${info.project.name}.png`,
      fullPage: true,
    });
    await dialog
      .getByRole("button", { name: "Fechar janela", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Nova coluna", exact: true })
      .click();
    const column = page.getByRole("dialog", {
      name: "Configurar coluna",
      exact: true,
    });
    await column.getByLabel("Nome da coluna").fill(unique);
    await column.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(column).not.toBeVisible();
    stageId = (await (await page.request.get("/api/admin/board")).json()).find(
      (s: { name: string }) => s.name === unique,
    ).id;
    await page
      .getByLabel(`Mover ${unique} para coluna`, { exact: true })
      .selectOption(stageId);
    await expect(
      page
        .locator(".kanban-column")
        .filter({ has: page.getByRole("heading", { name: unique }) })
        .locator(".kanban-card"),
    ).toHaveCount(1);
    await page.reload();
    await expect(
      page.getByLabel(`Mover ${unique} para coluna`, { exact: true }),
    ).toHaveValue(stageId);
    await page.screenshot({
      path: `docs/mari/v2-kanban-${info.project.name}.png`,
      fullPage: true,
    });
    await page.goto("/admin?tab=agenda");
    await expect(page.locator(".calendar-event")).toHaveCount(2);
    await page.getByLabel("Visualização").selectOption("week");
    await expect(page.locator(".calendar-event")).toHaveCount(2);
    await page.getByLabel("Visualização").selectOption("day");
    await expect(page.locator(".calendar-event")).toHaveCount(2);
    await page.screenshot({
      path: `docs/mari/v2-agenda-${info.project.name}.png`,
      fullPage: true,
    });
    const guest = await browser.newContext({
      viewport: info.project.use.viewport,
      httpCredentials: info.project.use.httpCredentials,
    });
    try {
      const shared = await guest.newPage();
      await shared.goto(`${baseURL}/selecao/${token}`);
      await expect(shared.locator(".cri-mini-card")).toHaveCount(2);
      const title = await shared.locator(".cri-hero-title").textContent();
      await shared.locator(".cri-mini-card").nth(1).click();
      await expect(shared.locator(".cri-hero-title")).not.toHaveText(title!);
      await expect(shared.locator("body")).not.toContainText(phone);
      await expect(shared.locator("body")).not.toContainText(
        "Observação privada",
      );
      expect(
        await shared.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await shared.screenshot({
        path: `docs/mari/v2-selection-${info.project.name}.png`,
        fullPage: true,
      });
      const clientReady = shared.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/client" && response.ok(),
      );
      await shared.goto(`${baseURL}/buscar`);
      await clientReady;
      await shared
        .getByRole("button", { name: "Filtros avançados", exact: false })
        .click();
      const filters = shared.getByRole("dialog", {
        name: "Filtros de imóveis",
        exact: true,
      });
      await expect(filters).toBeVisible();
      await filters.locator('select[name="cityId"]').selectOption("camboriu-sc");
      await expect(filters.locator('select[name="cityId"]')).toHaveValue(
        "camboriu-sc",
      );
      await filters.getByRole("button", { name: /Ver \d+ imóveis/ }).click();
      await expect(shared).toHaveURL(/cityId=camboriu-sc/);
    } finally {
      await guest.close();
    }
  } finally {
    for (const id of appointmentIds)
      await page.request.delete(`/api/admin/appointments/${id}`, {
        headers,
        data: {},
      });
    if (stageId)
      await page.request.delete(`/api/admin/stages/${stageId}`, {
        headers,
        data: { destinationId: initial.id },
      });
    if (leadId)
      await page.request.delete(`/api/admin/leads/${leadId}`, {
        headers,
        data: {},
      });
    await page.request.post("/api/admin/logout", { headers, data: {} });
  }
});

