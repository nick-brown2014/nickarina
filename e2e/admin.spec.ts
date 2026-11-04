// Admin dashboard login + admin API bearer-secret gating.
// External deps: none. Dashboard data is mocked via page.route so no database
// is needed; the real /api/rsvp/admin and /api/guests/seed handlers are only hit
// on paths that reject before any Prisma call. ADMIN_SECRET is the test-only
// value from e2e/constants.ts injected by playwright.config.ts.
import { E2E_ADMIN_SECRET } from "./constants";
import { expect, test } from "./fixtures";

test("admin page is reachable without the site password", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByLabel("Admin Secret")).toBeVisible();
});

test("rejects a wrong admin secret via the real API", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Admin Secret").fill("wrong-secret");
  await page.getByRole("button", { name: "Access Dashboard" }).click();
  await expect(page.getByText("Invalid admin secret.")).toBeVisible();
});

test("shows the dashboard for the right secret (API mocked)", async ({ page }) => {
  let auth: string | undefined;
  await page.route("**/api/rsvp/admin", (route) => {
    auth = route.request().headers()["authorization"];
    return route.fulfill({
      json: {
        guests: [
          { id: "g1", firstName: "Fred", lastName: "Porter", partyId: "party-1", rsvp: null },
        ],
        stats: {
          totalGuests: 1, responded: 0, notResponded: 1,
          attendingWelcome: 0, attendingCeremony: 0, attendingReception: 0, attendingBrunch: 0,
          welcomeShuttleCount: 0, ceremonyShuttleCount: 0, meatCount: 0, vegetarianCount: 0,
        },
      },
    });
  });
  await page.goto("/admin");
  await page.getByLabel("Admin Secret").fill(E2E_ADMIN_SECRET);
  await page.getByRole("button", { name: "Access Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "RSVP Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fred Porter" })).toBeVisible();
  expect(auth).toBe(`Bearer ${E2E_ADMIN_SECRET}`);
});

test("admin APIs require the bearer secret", async ({ request }) => {
  const wrong = { Authorization: "Bearer nope" };
  expect((await request.get("/api/rsvp/admin")).status()).toBe(401);
  expect((await request.get("/api/rsvp/admin", { headers: wrong })).status()).toBe(401);
  expect((await request.post("/api/rsvp/admin", { headers: wrong, data: {} })).status()).toBe(401);
  expect((await request.patch("/api/rsvp/admin", { headers: wrong, data: {} })).status()).toBe(401);
  expect((await request.delete("/api/rsvp/admin", { headers: wrong, data: {} })).status()).toBe(401);
  expect((await request.post("/api/guests/seed", { headers: wrong })).status()).toBe(401);
});
