// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, middleware } from "./middleware";

const BASE = "http://localhost:3000";

function makeRequest(pathname: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(pathname, BASE), { headers });
}

function isPassThrough(res: Response) {
  return res.headers.get("x-middleware-next") === "1";
}

describe("middleware site-access gate", () => {
  it.each(["/", "/details", "/rsvp", "/faq", "/api/rsvp/search", "/api/rsvp/submit"])(
    "redirects %s to /password without the access cookie",
    (path) => {
      const res = middleware(makeRequest(path));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${BASE}/password`);
    }
  );

  it("redirects when the cookie has an unexpected value", () => {
    const res = middleware(makeRequest("/details", "site_access=nope"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${BASE}/password`);
  });

  it.each(["/", "/details", "/api/rsvp/search"])(
    "passes %s through with site_access=granted",
    (path) => {
      const res = middleware(makeRequest(path, "site_access=granted"));
      expect(isPassThrough(res)).toBe(true);
      expect(res.headers.get("location")).toBeNull();
    }
  );

  it.each(["/password", "/api/password"])(
    "always allows the password page/API (%s)",
    (path) => {
      expect(isPassThrough(middleware(makeRequest(path)))).toBe(true);
    }
  );

  it.each(["/admin", "/api/rsvp/admin", "/api/guests/seed"])(
    "exempts admin route %s (it is protected by ADMIN_SECRET instead)",
    (path) => {
      expect(isPassThrough(middleware(makeRequest(path)))).toBe(true);
    }
  );

  it("does not exempt look-alike admin paths", () => {
    const res = middleware(makeRequest("/admin/extra"));
    expect(res.status).toBe(307);
  });
});

describe("middleware matcher", () => {
  const [matcher] = config.matcher;
  const regex = new RegExp(`^${matcher}$`);

  it("has a single matcher", () => {
    expect(config.matcher).toHaveLength(1);
  });

  it.each(["/", "/details", "/api/rsvp/search", "/password"])(
    "runs on %s",
    (path) => {
      expect(regex.test(path)).toBe(true);
    }
  );

  it.each([
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/favicon.ico",
    "/moon.png",
    "/images/a.jpg",
    "/x.jpeg",
    "/x.svg",
    "/x.gif",
    "/x.webp",
  ])("skips static asset %s", (path) => {
    expect(regex.test(path)).toBe(false);
  });
});
