import { test as base, expect, type BrowserContext } from "@playwright/test";

export const SITE_ACCESS_COOKIE = { name: "site_access", value: "granted" };

export async function grantSiteAccess(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ ...SITE_ACCESS_COOKIE, url: baseURL }]);
}

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

// Every spec uses this `test`: requests to any non-local host (Pinterest embed
// script, weather/maps/etc.) are aborted so runs never depend on third parties.
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.route(
      (url) => !LOCAL_HOSTS.has(url.hostname),
      (route) => route.abort()
    );
    await provide(context);
  },
});

export { expect };
