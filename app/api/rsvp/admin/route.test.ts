// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, headersMock } = vi.hoisted(() => ({
  prisma: {
    guest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rsvp: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
  headersMock: vi.fn(),
}));
vi.mock("@/app/lib/prisma", () => ({ prisma }));
vi.mock("next/headers", () => ({ headers: headersMock }));

import { DELETE, GET, PATCH, POST } from "./route";

const SECRET = "test-admin-secret";

function authAs(value?: string) {
  headersMock.mockResolvedValue(
    new Headers(value === undefined ? {} : { authorization: value })
  );
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/rsvp/admin", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const rsvp = (overrides: Record<string, unknown> = {}) => ({
  welcomeParty: null,
  welcomePartyShuttle: null,
  ceremony: null,
  ceremonyShuttle: null,
  reception: null,
  goodbyeBrunch: null,
  mealChoice: null,
  dietaryNotes: null,
  ...overrides,
});

describe("/api/rsvp/admin", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", SECRET);
    authAs(`Bearer ${SECRET}`);
  });

  describe("authorization", () => {
    const handlers = {
      GET: () => GET(),
      POST: () => POST(jsonRequest("POST", { firstName: "a", lastName: "b", partyId: "c" })),
      PATCH: () => PATCH(jsonRequest("PATCH", { id: "g1" })),
      DELETE: () => DELETE(jsonRequest("DELETE", { id: "g1" })),
    };

    it.each(Object.entries(handlers))("%s returns 401 without a token", async (_m, call) => {
      authAs();
      const res = await call();
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    });

    it.each(Object.entries(handlers))("%s returns 401 with a wrong token", async (_m, call) => {
      authAs("Bearer wrong");
      expect((await call()).status).toBe(401);
    });

    it.each(Object.entries(handlers))(
      "%s returns 401 when ADMIN_SECRET is unset",
      async (_m, call) => {
        vi.stubEnv("ADMIN_SECRET", "");
        authAs("Bearer ");
        expect((await call()).status).toBe(401);
      }
    );

    it("never touches the database when unauthorized", async () => {
      authAs();
      for (const call of Object.values(handlers)) await call();
      for (const model of [prisma.guest, prisma.rsvp]) {
        for (const fn of Object.values(model)) expect(fn).not.toHaveBeenCalled();
      }
    });
  });

  describe("GET", () => {
    it("returns guests ordered by name and computes stats", async () => {
      const guests = [
        { id: "1", rsvp: null },
        {
          id: "2",
          rsvp: rsvp({
            welcomeParty: true,
            welcomePartyShuttle: true,
            ceremony: true,
            ceremonyShuttle: true,
            reception: true,
            goodbyeBrunch: true,
            mealChoice: "MEAT",
          }),
        },
        {
          id: "3",
          rsvp: rsvp({ ceremony: true, reception: true, mealChoice: "VEGETARIAN" }),
        },
        {
          id: "4",
          rsvp: rsvp({
            welcomeParty: false,
            ceremony: false,
            reception: false,
            goodbyeBrunch: false,
          }),
        },
      ];
      prisma.guest.findMany.mockResolvedValue(guests);

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(prisma.guest.findMany).toHaveBeenCalledWith({
        include: { rsvp: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
      expect(body.guests).toEqual(guests);
      expect(body.stats).toEqual({
        totalGuests: 4,
        responded: 3,
        notResponded: 1,
        attendingWelcome: 1,
        attendingCeremony: 2,
        attendingReception: 2,
        attendingBrunch: 1,
        welcomeShuttleCount: 1,
        ceremonyShuttleCount: 1,
        meatCount: 1,
        vegetarianCount: 1,
      });
    });

    it("returns zeroed stats for an empty guest list", async () => {
      prisma.guest.findMany.mockResolvedValue([]);
      const body = await (await GET()).json();
      expect(Object.values(body.stats).every((v) => v === 0)).toBe(true);
    });

    it("returns 500 when the query fails", async () => {
      prisma.guest.findMany.mockRejectedValue(new Error("db"));
      const res = await GET();
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to fetch RSVP data" });
    });
  });

  describe("POST", () => {
    it.each([
      { lastName: "B", partyId: "p" },
      { firstName: "A", partyId: "p" },
      { firstName: "A", lastName: "B" },
      { firstName: " ", lastName: "B", partyId: "p" },
    ])("returns 400 when a required field is blank (%j)", async (body) => {
      const res = await POST(jsonRequest("POST", body));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "firstName, lastName, and partyId are required",
      });
      expect(prisma.guest.create).not.toHaveBeenCalled();
    });

    it("creates a guest with trimmed fields", async () => {
      const created = { id: "new", firstName: "Ada", lastName: "Lovelace", partyId: "party-9", rsvp: null };
      prisma.guest.create.mockResolvedValue(created);
      const res = await POST(
        jsonRequest("POST", { firstName: " Ada ", lastName: " Lovelace", partyId: "party-9 " })
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ guest: created });
      expect(prisma.guest.create).toHaveBeenCalledWith({
        data: { firstName: "Ada", lastName: "Lovelace", partyId: "party-9" },
        include: { rsvp: true },
      });
    });

    it("returns 500 when create fails", async () => {
      prisma.guest.create.mockRejectedValue(new Error("db"));
      const res = await POST(jsonRequest("POST", { firstName: "A", lastName: "B", partyId: "p" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to create guest" });
    });
  });

  describe("PATCH", () => {
    beforeEach(() => {
      prisma.guest.findUnique.mockResolvedValue({ id: "g1", rsvp: null });
    });

    it("returns 400 without an id", async () => {
      const res = await PATCH(jsonRequest("PATCH", { firstName: "A" }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "id is required" });
      expect(prisma.guest.update).not.toHaveBeenCalled();
    });

    it("only updates non-blank, trimmed name/party fields and leaves the RSVP alone", async () => {
      const res = await PATCH(
        jsonRequest("PATCH", { id: "g1", firstName: " Ada ", lastName: "  ", partyId: "party-2" })
      );
      expect(res.status).toBe(200);
      expect(prisma.guest.update).toHaveBeenCalledWith({
        where: { id: "g1" },
        data: { firstName: "Ada", partyId: "party-2" },
      });
      expect(prisma.rsvp.upsert).not.toHaveBeenCalled();
      expect(prisma.rsvp.deleteMany).not.toHaveBeenCalled();
      expect(await res.json()).toEqual({ guest: { id: "g1", rsvp: null } });
      expect(prisma.guest.findUnique).toHaveBeenCalledWith({
        where: { id: "g1" },
        include: { rsvp: true },
      });
    });

    it("upserts the RSVP when one is provided, trimming notes", async () => {
      const input = rsvp({ ceremony: true, mealChoice: "MEAT", dietaryNotes: "  gluten free " });
      await PATCH(jsonRequest("PATCH", { id: "g1", rsvp: input }));
      const expected = { ...input, dietaryNotes: "gluten free" };
      expect(prisma.rsvp.upsert).toHaveBeenCalledWith({
        where: { guestId: "g1" },
        create: { guestId: "g1", ...expected },
        update: expected,
      });
    });

    it("stores blank dietary notes as null", async () => {
      await PATCH(jsonRequest("PATCH", { id: "g1", rsvp: rsvp({ dietaryNotes: "   " }) }));
      expect(prisma.rsvp.upsert.mock.calls[0][0].update.dietaryNotes).toBeNull();
    });

    it("deletes the RSVP when rsvp is explicitly null", async () => {
      await PATCH(jsonRequest("PATCH", { id: "g1", rsvp: null }));
      expect(prisma.rsvp.deleteMany).toHaveBeenCalledWith({ where: { guestId: "g1" } });
      expect(prisma.rsvp.upsert).not.toHaveBeenCalled();
    });

    it("returns 500 when the update fails", async () => {
      prisma.guest.update.mockRejectedValue(new Error("not found"));
      const res = await PATCH(jsonRequest("PATCH", { id: "missing" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to update guest" });
    });
  });

  describe("DELETE", () => {
    it("returns 400 without an id", async () => {
      const res = await DELETE(jsonRequest("DELETE", {}));
      expect(res.status).toBe(400);
      expect(prisma.guest.delete).not.toHaveBeenCalled();
    });

    it("deletes the guest", async () => {
      prisma.guest.delete.mockResolvedValue({});
      const res = await DELETE(jsonRequest("DELETE", { id: "g1" }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(prisma.guest.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
    });

    it("returns 500 when delete fails", async () => {
      prisma.guest.delete.mockRejectedValue(new Error("db"));
      const res = await DELETE(jsonRequest("DELETE", { id: "g1" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to delete guest" });
    });
  });
});
