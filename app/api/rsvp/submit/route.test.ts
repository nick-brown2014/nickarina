// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  rsvp: { upsert: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/app/lib/prisma", () => ({ prisma }));

import { POST } from "./route";

function post(body: unknown) {
  return new Request("http://localhost/api/rsvp/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const base = {
  guestId: "g1",
  welcomeParty: false,
  welcomePartyShuttle: false,
  ceremony: false,
  ceremonyShuttle: false,
  reception: false,
  goodbyeBrunch: false,
  mealChoice: null as "MEAT" | "VEGETARIAN" | null,
  dietaryNotes: "",
};

const NOW = new Date("2026-10-01T12:00:00Z");

describe("POST /api/rsvp/submit", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    prisma.rsvp.upsert.mockImplementation((args) => ({ upsertArgs: args }));
    prisma.$transaction.mockImplementation(async (ops: unknown[]) => ops);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([{}, { rsvps: [] }, { rsvps: "nope" }, { rsvps: null }])(
    "returns 400 when no RSVP data is provided (%j)",
    async (body) => {
      const res = await POST(post(body));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "No RSVP data provided" });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    }
  );

  it("upserts every guest inside a single transaction", async () => {
    const res = await POST(
      post({ rsvps: [{ ...base, guestId: "g1" }, { ...base, guestId: "g2" }] })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, count: 2 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
    expect(prisma.rsvp.upsert.mock.calls.map(([a]) => a.where)).toEqual([
      { guestId: "g1" },
      { guestId: "g2" },
    ]);
  });

  it("saves a full acceptance with shuttles and meal choice", async () => {
    await POST(
      post({
        rsvps: [
          {
            ...base,
            welcomeParty: true,
            welcomePartyShuttle: true,
            ceremony: true,
            ceremonyShuttle: true,
            reception: true,
            goodbyeBrunch: true,
            mealChoice: "VEGETARIAN",
            dietaryNotes: "No nuts",
          },
        ],
      })
    );
    const args = prisma.rsvp.upsert.mock.calls[0][0];
    const expected = {
      welcomeParty: true,
      welcomePartyShuttle: true,
      ceremony: true,
      ceremonyShuttle: true,
      reception: true,
      goodbyeBrunch: true,
      mealChoice: "VEGETARIAN",
      dietaryNotes: "No nuts",
    };
    expect(args.create).toEqual({ guestId: "g1", ...expected });
    expect(args.update).toEqual({ ...expected, submittedAt: NOW });
  });

  it("nulls shuttle legs, meal and notes for a full decline", async () => {
    await POST(
      post({
        rsvps: [
          {
            ...base,
            welcomePartyShuttle: true,
            ceremonyShuttle: true,
            mealChoice: "MEAT",
          },
        ],
      })
    );
    const { create, update } = prisma.rsvp.upsert.mock.calls[0][0];
    for (const data of [create, update]) {
      expect(data).toMatchObject({
        welcomeParty: false,
        welcomePartyShuttle: null,
        ceremony: false,
        ceremonyShuttle: null,
        reception: false,
        goodbyeBrunch: false,
        mealChoice: null,
        dietaryNotes: null,
      });
    }
  });

  it("keeps the ceremony shuttle and meal when only the reception is attended", async () => {
    await POST(
      post({
        rsvps: [{ ...base, reception: true, ceremonyShuttle: true, mealChoice: "MEAT" }],
      })
    );
    const { create } = prisma.rsvp.upsert.mock.calls[0][0];
    expect(create).toMatchObject({ ceremonyShuttle: true, mealChoice: "MEAT" });
  });

  it("coerces missing shuttle answers to false for attended events", async () => {
    await POST(
      post({
        rsvps: [
          {
            ...base,
            welcomeParty: true,
            welcomePartyShuttle: undefined,
            ceremony: true,
            ceremonyShuttle: undefined,
          },
        ],
      })
    );
    const { create } = prisma.rsvp.upsert.mock.calls[0][0];
    expect(create.welcomePartyShuttle).toBe(false);
    expect(create.ceremonyShuttle).toBe(false);
  });

  it("returns 500 when the transaction fails", async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(post({ rsvps: [base] }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to save RSVP. Please try again." });
  });
});
