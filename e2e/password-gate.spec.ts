// Site-access password gate (middleware.ts + /password + /api/password).
// External deps: none — third-party requests are aborted by the shared fixture,
// and no route exercised here touches the database. Runs against `next start`.
import { SITE_PASSWORD } from "./constants";
import { expect, grantSiteAccess, test } from "./fixtures";

const PROTECTED = ["/", "/our-story", "/details", "/theme", "/rsvp", "/registry", "/faq"];

test.describe("password gate", () => {
  for (const path of PROTECTED) {
    test(`redirects ${path} to /password without the access cookie`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/password$/);
      await expect(page.getByPlaceholder("Enter password")).toBeVisible();
    });
  }

  test("redirects at the HTTP level and gates API routes too", async ({ request, baseURL }) => {
    for (const path of ["/details", "/api/rsvp/search"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(new URL(res.headers()["location"], baseURL).pathname).toBe("/password");
    }
  });

  test("does not gate static assets, the password API, or admin routes", async ({ request }) => {
    expect((await request.get("/next.svg", { maxRedirects: 0 })).status()).toBe(200);
    expect((await request.get("/admin", { maxRedirects: 0 })).status()).toBe(200);
    expect((await request.get("/api/rsvp/admin", { maxRedirects: 0 })).status()).toBe(401);
    const res = await request.post("/api/password", { data: { password: "nope" }, maxRedirects: 0 });
    expect(res.status()).toBe(401);
  });

  test("hides site navigation on the password page", async ({ page }) => {
    await page.goto("/password");
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });

  test("toggles password visibility", async ({ page }) => {
    await page.goto("/password");
    const input = page.getByPlaceholder("Enter password");
    await expect(input).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(input).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("rejects a wrong password and clears the field", async ({ page, context }) => {
    await page.goto("/password");
    const input = page.getByPlaceholder("Enter password");
    await input.fill("definitely-wrong");
    await input.press("Enter");
    await expect(page.getByText("Wrong password")).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(page).toHaveURL(/\/password$/);
    expect((await context.cookies()).find((c) => c.name === "site_access")).toBeUndefined();
  });

  test("requires a value before submitting", async ({ page }) => {
    await page.goto("/password");
    const input = page.getByPlaceholder("Enter password");
    await input.press("Enter");
    expect(await input.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/password$/);
  });

  test("grants access with the correct password", async ({ page, context }) => {
    await page.goto("/password");
    await page.getByPlaceholder("Enter password").fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Enter/ }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("October 31, 2026", { exact: true })).toBeVisible();
    const cookie = (await context.cookies()).find((c) => c.name === "site_access");
    expect(cookie).toMatchObject({ value: "granted", httpOnly: true, sameSite: "Lax" });

    await page.goto("/faq");
    await expect(page).toHaveURL(/\/faq$/);
  });

  test("a pre-set access cookie lets the visitor straight in", async ({ page, context, baseURL }) => {
    await grantSiteAccess(context, baseURL!);
    await page.goto("/details");
    await expect(page).toHaveURL(/\/details$/);
  });
});
