// Full RSVP round trip against a real (local, throwaway) Postgres.
// External deps: REQUIRES E2E_DATABASE_URL pointing at localhost with the
// Prisma migrations applied (`DATABASE_URL=$E2E_DATABASE_URL npx prisma migrate deploy`).
// Skipped otherwise. Creates one uniquely-named guest through the admin API and
// deletes it afterwards, so it never touches /api/guests/seed (which wipes data).
import { E2E_ADMIN_SECRET } from "./constants";
import { expect, grantSiteAccess, test } from "./fixtures";

test.skip(!process.env.E2E_DATABASE_URL, "E2E_DATABASE_URL not set; DB-backed flow skipped");
test.describe.configure({ mode: "serial" });

const admin = { Authorization: `Bearer ${E2E_ADMIN_SECRET}` };
const lastName = `E2e${Date.now()}`;
let guestId: string | undefined;

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api/rsvp/admin", {
    headers: admin,
    data: { firstName: "Robin", lastName, partyId: `party-${lastName}` },
  });
  expect(res.status()).toBe(200);
  guestId = (await res.json()).guest.id;
});

test.afterAll(async ({ request }) => {
  if (guestId) await request.delete("/api/rsvp/admin", { headers: admin, data: { id: guestId } });
});

test("guest finds their invitation, RSVPs, and the admin API sees it", async ({ page, context, baseURL, request }) => {
  await grantSiteAccess(context, baseURL!);
  await page.goto("/rsvp");
  await page.getByLabel("Last Name").fill(lastName.toLowerCase());
  await page.getByRole("button", { name: "Find My Invitation" }).click();
  await page.getByText(`Robin ${lastName}`).click();

  await page.getByRole("button", { name: "Accept" }).nth(0).click();
  await page.getByRole("button", { name: "Yes" }).first().click();
  await page.getByRole("button", { name: "Decline" }).nth(1).click();
  await page.getByRole("button", { name: "Decline" }).nth(2).click();
  await page.getByRole("button", { name: "Submit RSVP" }).click();
  await expect(page.getByRole("heading", { name: "Response Recorded" })).toBeVisible();

  const { guests } = await (await request.get("/api/rsvp/admin", { headers: admin })).json();
  const guest = guests.find((g: { id: string }) => g.id === guestId);
  expect(guest.rsvp).toMatchObject({
    welcomeParty: true,
    welcomePartyShuttle: true,
    ceremony: false,
    reception: false,
    goodbyeBrunch: false,
    mealChoice: null,
  });
});
