// Top-level navigation between the public content pages (desktop + mobile menu).
// External deps: none — third-party requests (Pinterest embed on /theme, etc.)
// are aborted by the shared fixture; pages under test are static/client-only.
// PageFader delays client navigation by ~500ms, so assertions rely on
// Playwright's auto-waiting rather than fixed sleeps.
import { expect, grantSiteAccess, test } from "./fixtures";

const PAGES = [
  { label: "Our Story", path: "/our-story", marker: { role: "heading", name: "Our Story" } },
  { label: "Details", path: "/details", marker: { role: "heading", name: "Costumed Welcome Party" } },
  { label: "Theme", path: "/theme", marker: { role: "heading", name: "Theme" } },
  { label: "RSVP", path: "/rsvp", marker: { role: "button", name: "Find My Invitation" } },
  { label: "Registry", path: "/registry", marker: { role: "link", name: "View Our Registry" } },
  { label: "FAQ", path: "/faq", marker: { role: "heading", name: "Frequently Asked Questions" } },
] as const;

test.beforeEach(async ({ context, baseURL }) => {
  await grantSiteAccess(context, baseURL!);
});

test("home page renders the event summary and RSVP call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Nick & Karina | October 31, 2026");
  await expect(page.getByText("Della Terra Mountain Chateau")).toBeVisible();
  await expect(page.getByAltText("Nicholas Brown")).toBeVisible();
  // The hero CTA, not the nav link of the same name.
  await page.locator('a[href="/rsvp"]:not(nav a)').click();
  await expect(page).toHaveURL(/\/rsvp$/);
});

test("desktop nav reaches every top-level page and back home", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation").first();
  for (const { label, path, marker } of PAGES) {
    await nav.getByRole("link", { name: label, exact: true }).filter({ visible: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole(marker.role, { name: marker.name, exact: true }).first()).toBeVisible();
  }
  await nav.getByRole("link", { name: "HOME" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("details page in-page section links scroll to their sections", async ({ page }) => {
  await page.goto("/details");
  await page.getByRole("navigation", { name: "Page sections" }).getByRole("link").nth(3).click();
  await expect(page).toHaveURL(/\/details#transportation$/);
  await expect(page.locator("#transportation")).toBeInViewport();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu toggles open, navigates, and closes", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle menu" });
    const faq = page.getByRole("navigation").getByRole("link", { name: "FAQ", exact: true });
    await expect(faq.filter({ visible: true })).toHaveCount(0);

    await toggle.click();
    await faq.filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(faq.filter({ visible: true })).toHaveCount(0);
  });
});
