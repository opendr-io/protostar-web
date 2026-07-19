import { expect, Page, Response, test } from '@playwright/test';

const username = process.env.SMOKE_USERNAME || 'appuser';
const password = process.env.SMOKE_PASSWORD || 'appuser';
const errorsByPage = new WeakMap<Page, Error[]>();

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);

  const loginResponse = page.waitForResponse(
    response => response.url().endsWith('/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Login' }).click();
  expect((await loginResponse).ok()).toBeTruthy();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function openWithApi(page: Page, route: string, apiPath: string): Promise<Response> {
  const apiResponse = page.waitForResponse(
    response => response.url().endsWith(apiPath) && response.request().method() !== 'OPTIONS',
  );
  await page.goto(route);
  const response = await apiResponse;
  expect(response.ok(), `${apiPath} returned ${response.status()}`).toBeTruthy();
  return response;
}

test.beforeEach(async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  errorsByPage.set(page, pageErrors);
  await login(page);
});

test.afterEach(async ({ page }) => {
  const pageErrors = errorsByPage.get(page) || [];
  expect(pageErrors.map(error => error.message), 'React page emitted an uncaught error').toEqual([]);
});

test('Tactical Summary renders graph data', async ({ page }) => {
  const response = await openWithApi(page, '/summary', '/showgraph');
  const payload = await response.json();

  expect(payload).toHaveProperty('n');
  expect(Object.keys(payload.n)).not.toHaveLength(0);
  await expect(page.getByText('Tactical View: Summary of scored detection lattices for entities')).toBeVisible();
  await expect(page.locator('div[title="Entity"]').first()).toBeVisible();
});

test('Detail View renders graph data for an entity', async ({ page }) => {
  await page.goto('/entity');
  const iframe = page.locator('iframe');
  await expect(iframe).toBeVisible();
  const graphFrame = await (await iframe.elementHandle())!.contentFrame();
  expect(graphFrame, 'Detail View iframe did not load').not.toBeNull();

  const entitySelect = graphFrame!.locator('select');
  await expect.poll(() => entitySelect.locator('option:not([disabled])').count(), {
    message: 'Detail View did not return any entities',
    timeout: 15_000,
  }).toBeGreaterThan(0);
  await entitySelect.selectOption({ index: 1 });

  const graphNodes = graphFrame!.locator('svg circle, svg rect');
  await expect.poll(() => graphNodes.count(), {
    message: 'Detail View did not render any graph nodes for the selected entity',
    timeout: 15_000,
  }).toBeGreaterThan(0);
  console.log(`Detail View rendered ${await graphNodes.count()} graph node(s)`);
});

test('Summary links an entity to its Details data', async ({ page }) => {
  await openWithApi(page, '/summary', '/showgraph');
  const entityCell = page.locator('div.cursor-pointer[title]').first();
  await expect(entityCell).toBeVisible();
  const selectedEntity = (await entityCell.textContent())!.trim();

  const detailsResponse = page.waitForResponse(
    response => response.url().endsWith('/entitydetailsneo') && response.request().method() === 'POST',
  );
  await entityCell.click();
  const response = await detailsResponse;
  expect(response.ok(), `/entitydetailsneo returned ${response.status()}`).toBeTruthy();
  expect(Object.keys(await response.json())).not.toHaveLength(0);

  await expect(page).toHaveURL(/\/details$/);
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible();
  await expect(page.getByText(`Entity: ${selectedEntity}`, { exact: true })).toBeVisible();
  console.log(`Details rendered data for ${selectedEntity}`);
});

test('Alerts renders entity alert data', async ({ page }) => {
  const entitiesResponse = page.waitForResponse(
    response => response.url().endsWith('/getentitiesneo') && response.request().method() === 'GET',
  );
  const detailsResponse = page.waitForResponse(
    response => response.url().endsWith('/rawentitydetailsneo') && response.request().method() === 'POST',
  );

  await page.goto('/alerts');
  const entitiesPayload = await (await entitiesResponse).json();
  const details = await detailsResponse;

  expect(entitiesPayload).toHaveProperty('entity');
  expect(Object.values(entitiesPayload.entity)).not.toHaveLength(0);
  expect(details.ok(), `/rawentitydetailsneo returned ${details.status()}`).toBeTruthy();
  const detailsPayload = await details.json();
  const alertCount = Object.values(detailsPayload.name).length;
  expect(alertCount).toBeGreaterThan(0);
  await expect(page.getByText(/^Entity: /).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alert Details' })).toHaveCount(alertCount);
  console.log(`Alerts rendered ${alertCount} alert card(s)`);
});

test('Cases loads its supporting API data', async ({ page }) => {
  const casesResponse = page.waitForResponse(
    response => response.url().endsWith('/getallcases') && response.request().method() === 'POST',
  );
  const usersResponse = page.waitForResponse(
    response => response.url().endsWith('/getusers') && response.request().method() === 'POST',
  );
  const entitiesResponse = page.waitForResponse(
    response => response.url().endsWith('/getallentities') && response.request().method() === 'POST',
  );

  await page.goto('/cases');
  const [cases, users, entities] = await Promise.all([casesResponse, usersResponse, entitiesResponse]);

  for (const response of [cases, users, entities]) {
    expect(response.ok(), `${response.url()} returned ${response.status()}`).toBeTruthy();
  }
  const casesPayload = (await cases.json()).flat();
  const usersPayload = await users.json();
  const entitiesPayload = await entities.json();
  expect(Array.isArray(casesPayload)).toBeTruthy();
  expect(Array.isArray(usersPayload)).toBeTruthy();
  expect(Array.isArray(entitiesPayload)).toBeTruthy();
  console.log(`Cases API returned ${casesPayload.length} case(s)`);

  if (casesPayload.length > 0) {
    expect(casesPayload[0]).toHaveProperty('casename');
    await page.getByText('Status: Open', { exact: true }).click();
    await page.getByRole('listitem').filter({ hasText: /^All$/ }).click();
    await expect(page.getByText('Status: All', { exact: true })).toBeVisible();
    await expect(page.getByText(casesPayload[0].casename, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole('complementary').getByRole('button', { name: 'Create Case' })).toBeVisible();
  await expect(page.getByRole('button', { name: /AI Comments:/ })).toBeVisible();
});

test('Settings displays the API log', async ({ page }) => {
  const logResponse = page.waitForResponse(
    response => response.url().includes('/apilog?') && response.request().method() === 'GET',
  );
  const statusResponse = page.waitForResponse(
    response => response.url().endsWith('/connectionstatus') && response.request().method() === 'GET',
  );
  await page.goto('/settings');
  const [response, connectionResponse] = await Promise.all([logResponse, statusResponse]);
  expect(response.ok(), `/apilog returned ${response.status()}`).toBeTruthy();
  expect(connectionResponse.ok(), `/connectionstatus returned ${connectionResponse.status()}`).toBeTruthy();
  const payload = await response.json();
  const connectionPayload = await connectionResponse.json();
  expect(Array.isArray(payload.lines)).toBeTruthy();
  expect(payload.line_count).toBe(payload.lines.length);
  expect(connectionPayload).toEqual({ flask: true, neo4j: true, postgresql: true });

  await expect(page.getByRole('heading', { name: 'Connection Status' })).toBeVisible();
  await expect(page.getByText('Connected', { exact: true })).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'API Log' })).toBeVisible();
  await expect(page.getByLabel('API log contents')).toContainText(payload.lines.at(-1) || 'The API log is empty.');
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  console.log(`Settings displayed ${payload.line_count} API log line(s)`);
});

const graphDashboards = [
  { name: 'Alpha Signals', route: '/primary', framePath: '/view2' },
  { name: 'Beta Signals', route: '/view4', framePath: '/experiment/view4' },
  { name: 'Gamma Signals', route: '/view5', framePath: '/experiment/view5' },
  { name: 'Chain Reactions', route: '/view6', framePath: '/experiment/view6' },
  { name: 'Isotopes', route: '/view7', framePath: '/experiment/view7' },
  { name: 'Global View', route: '/everything', framePath: '/view1' },
];

for (const dashboard of graphDashboards) {
  test(`${dashboard.name} renders graph data`, async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(dashboard.route);
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', new RegExp(`${dashboard.framePath}/?$`));
    const graphFrame = await (await iframe.elementHandle())!.contentFrame();
    expect(graphFrame, `${dashboard.name} iframe did not load`).not.toBeNull();
    const graphNodes = graphFrame!.locator('svg circle, svg rect');
    await expect.poll(() => graphNodes.count(), {
      message: `${dashboard.name} did not render any graph nodes`,
      timeout: 30_000,
    }).toBeGreaterThan(0);
    console.log(`${dashboard.name} rendered ${await graphNodes.count()} graph node(s)`);
  });
}
