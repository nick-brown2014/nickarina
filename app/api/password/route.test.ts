// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function post(body: unknown) {
  return new Request("http://localhost/api/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/password", () => {
  it("sets the site_access cookie for the correct password", async () => {
    const res = await POST(post({ password: "karinanick" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("site_access=granted");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 90}`);
  });

  it("does not mark the cookie Secure outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const res = await POST(post({ password: "karinanick" }));
    expect(res.headers.get("set-cookie")).not.toMatch(/Secure/i);
  });

  it("marks the cookie Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await POST(post({ password: "karinanick" }));
    expect(res.headers.get("set-cookie")).toMatch(/Secure/i);
  });

  it.each([
    ["wrong password", { password: "nope" }],
    ["different case", { password: "KarinaNick" }],
    ["missing password", {}],
  ])("returns 401 without a cookie for %s", async (_label, body) => {
    const res = await POST(post(body));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Wrong password" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a malformed JSON body", async () => {
    const req = new Request("http://localhost/api/password", {
      method: "POST",
      body: "not json",
    });
    await expect(POST(req)).rejects.toThrow();
  });
});
