// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import seedData from "@/prisma/seed-data.json";

const prisma = vi.hoisted(() => ({
  guest: { deleteMany: vi.fn(), createMany: vi.fn() },
  rsvp: { deleteMany: vi.fn() },
}));
vi.mock("@/app/lib/prisma", () => ({ prisma }));

import { POST } from "./route";

const SECRET = "test-admin-secret";

function post(auth?: string) {
  return new Request("http://localhost/api/guests/seed", {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
}

const expectedGuests = seedData.flatMap((unit) =>
  unit.members.map((m) => ({
    firstName: m.firstName,
    lastName: m.lastName,
    partyId: unit.partyId,
  }))
);

describe("POST /api/guests/seed", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", SECRET);
    prisma.guest.createMany.mockResolvedValue({ count: expectedGuests.length });
  });

  it("returns 401 without an Authorization header", async () => {
    const res = await POST(post());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(prisma.guest.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong bearer token", async () => {
    const res = await POST(post("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(prisma.rsvp.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret is sent without the Bearer prefix", async () => {
    const res = await POST(post(SECRET));
    expect(res.status).toBe(401);
  });

  it("returns 401 when ADMIN_SECRET is not configured, even for 'Bearer '", async () => {
    vi.stubEnv("ADMIN_SECRET", "");
    const res = await POST(post("Bearer "));
    expect(res.status).toBe(401);
    expect(prisma.guest.createMany).not.toHaveBeenCalled();
  });

  it("wipes RSVPs then guests, and inserts every seed member with its partyId", async () => {
    const res = await POST(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      units: seedData.length,
      guests: expectedGuests.length,
    });

    expect(prisma.rsvp.deleteMany).toHaveBeenCalledWith();
    expect(prisma.guest.deleteMany).toHaveBeenCalledWith();
    expect(prisma.rsvp.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.guest.deleteMany.mock.invocationCallOrder[0]
    );
    expect(prisma.guest.createMany).toHaveBeenCalledWith({ data: expectedGuests });
  });

  it("returns 500 when the database fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.guest.createMany.mockRejectedValue(new Error("db down"));
    const res = await POST(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to seed guests" });
    expect(consoleError).toHaveBeenCalled();
  });
});
