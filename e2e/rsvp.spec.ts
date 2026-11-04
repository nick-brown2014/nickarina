// RSVP client flow with the RSVP APIs mocked via page.route, plus the
// validation paths of the real API routes that return before any DB access.
// External deps: none. The real DB-backed round trip lives in rsvp-db.spec.ts
// and is skipped unless E2E_DATABASE_URL points at a local throwaway Postgres.
import type { Page, Request } from "@playwright/test";
import { expect, grantSiteAccess, test } from "./fixtures";

const party = {
  partyId: "party-e2e",
  members: [
    { id: "g1", firstName: "Fred", lastName: "Porter", partyId: "party-e2e", rsvp: null },
    { id: "g2", firstName: "Ingrid", lastName: "Porter", partyId: "party-e2e", rsvp: null },
  ],
};

test.beforeEach(async ({ context, baseURL }) => {
  await grantSiteAccess(context, baseURL!);
});

async function mockSearch(page: Page, body: unknown, status = 200) {
  const calls: Request[] = [];
  await page.route("**/api/rsvp/search", (route) => {
    calls.push(route.request());
    return route.fulfill({ status, json: body });
  });
  return calls;
}

test("requires a last name before searching", async ({ page }) => {
  const calls = await mockSearch(page, { parties: [party] });
  await page.goto("/rsvp");
  const input = page.getByLabel("Last Name");
  await page.getByRole("button", { name: "Find My Invitation" }).click();
  expect(await input.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  expect(calls).toHaveLength(0);
});

test("shows the API error when no guest matches", async ({ page }) => {
  await mockSearch(page, { error: "We couldn’t find that name on our guest list." }, 404);
  await page.goto("/rsvp");
  await page.getByLabel("Last Name").fill("Nobody");
  await page.getByRole("button", { name: "Find My Invitation" }).click();
  await expect(page.getByText("We couldn’t find that name on our guest list.")).toBeVisible();
});

test("walks a two-person party through the RSVP and submits both answers", async ({ page }) => {
  const searches = await mockSearch(page, { parties: [party] });
  let submitted: unknown;
  await page.route("**/api/rsvp/submit", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: { success: true } });
  });

  await page.goto("/rsvp");
  await page.getByLabel("Last Name").fill("  Porter ");
  await page.getByRole("button", { name: "Find My Invitation" }).click();
  expect(searches[0].postDataJSON()).toEqual({ lastName: "Porter" });

  await expect(page.getByText("We found your group. Please confirm it below.")).toBeVisible();
  await page.getByText("Fred Porter, Ingrid Porter").click();

  await expect(page.getByText("Responding for Fred Porter (1 of 2)")).toBeVisible();
  const accept = page.getByRole("button", { name: "Accept" });
  const decline = page.getByRole("button", { name: "Decline" });
  await accept.nth(1).click();
  await expect(page.getByText("Meal Selection")).toBeVisible();
  await page.getByRole("button", { name: "Meat" }).click();
  await page.getByLabel("Dietary Restrictions or Notes").fill("No shellfish");
  await page.getByRole("button", { name: "Next Guest" }).click();

  await expect(page.getByText("Responding for Ingrid Porter (2 of 2)")).toBeVisible();
  await decline.nth(0).click();
  await decline.nth(1).click();
  await decline.nth(2).click();
  await page.getByRole("button", { name: "Submit RSVP" }).click();

  await expect(page.getByRole("heading", { name: "Response Recorded" })).toBeVisible();
  await expect(page.getByText("Unable to attend")).toBeVisible();
  expect(submitted).toMatchObject({
    rsvps: [
      { guestId: "g1", ceremony: true, reception: true, mealChoice: "MEAT", dietaryNotes: "No shellfish" },
      { guestId: "g2", welcomeParty: false, ceremony: false, goodbyeBrunch: false, mealChoice: null },
    ],
  });

  await page.getByRole("button", { name: "RSVP for Another Guest" }).click();
  await expect(page.getByLabel("Last Name")).toHaveValue("");
});

// page.request shares the browser context's site_access cookie; the bare
// `request` fixture would be redirected to /password by the middleware.
test("real RSVP APIs validate input before touching the database", async ({ page }) => {
  const { request } = page;
  const search = await request.post("/api/rsvp/search", { data: { lastName: "   " } });
  expect(search.status()).toBe(400);
  expect(await search.json()).toEqual({ error: "Please enter your last name" });

  const submit = await request.post("/api/rsvp/submit", { data: { rsvps: [] } });
  expect(submit.status()).toBe(400);
});
