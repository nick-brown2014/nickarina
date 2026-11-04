// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({ guest: { findMany: vi.fn() } }));
vi.mock("@/app/lib/prisma", () => ({ prisma }));

import { POST } from "./route";

function post(body: unknown) {
  return new Request("http://localhost/api/rsvp/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const guest = (id: string, firstName: string, lastName: string, partyId: string) => ({
  id,
  firstName,
  lastName,
  partyId,
  rsvp: null,
});

describe("POST /api/rsvp/search", () => {
  beforeEach(() => {
    prisma.guest.findMany.mockReset();
  });

  it.each([{}, { lastName: "" }, { lastName: "   " }])(
    "returns 400 for a blank last name (%j)",
    async (body) => {
      const res = await POST(post(body));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Please enter your last name" });
      expect(prisma.guest.findMany).not.toHaveBeenCalled();
    }
  );

  it("returns 404 when no guest matches", async () => {
    prisma.guest.findMany.mockResolvedValueOnce([]);
    const res = await POST(post({ lastName: "Nobody" }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/couldn.t find that name/);
  });

  it("searches case-insensitively on the trimmed last name", async () => {
    prisma.guest.findMany.mockResolvedValueOnce([]);
    await POST(post({ lastName: "  porter " }));
    expect(prisma.guest.findMany).toHaveBeenCalledWith({
      where: { lastName: { equals: "porter", mode: "insensitive" } },
      include: { rsvp: true },
      orderBy: [{ partyId: "asc" }, { firstName: "asc" }],
    });
  });

  it("groups matches by party and expands each party to all of its members", async () => {
    const fred = guest("g1", "Fred", "Porter", "party-1");
    const ingrid = guest("g2", "Ingrid", "McMillan", "party-1");
    const phoebe = guest("g3", "Phoebe", "Porter", "party-3");
    const sam = guest("g4", "Sam", "Porter", "party-3");

    prisma.guest.findMany
      .mockResolvedValueOnce([fred, phoebe, sam])
      .mockResolvedValueOnce([fred, ingrid])
      .mockResolvedValueOnce([phoebe, sam]);

    const res = await POST(post({ lastName: "Porter" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      parties: [
        { partyId: "party-1", members: [fred, ingrid] },
        { partyId: "party-3", members: [phoebe, sam] },
      ],
    });

    expect(prisma.guest.findMany).toHaveBeenCalledTimes(3);
    expect(prisma.guest.findMany).toHaveBeenNthCalledWith(2, {
      where: { partyId: "party-1" },
      include: { rsvp: true },
      orderBy: [{ firstName: "asc" }],
    });
    expect(prisma.guest.findMany).toHaveBeenNthCalledWith(3, {
      where: { partyId: "party-3" },
      include: { rsvp: true },
      orderBy: [{ firstName: "asc" }],
    });
  });

  it("returns 500 when the database throws", async () => {
    prisma.guest.findMany.mockRejectedValueOnce(new Error("boom"));
    const res = await POST(post({ lastName: "Porter" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Something went wrong. Please try again." });
  });

  it("returns 500 for a malformed body", async () => {
    const res = await POST(
      new Request("http://localhost/api/rsvp/search", { method: "POST", body: "{" })
    );
    expect(res.status).toBe(500);
  });
});
