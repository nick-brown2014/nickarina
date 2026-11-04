// @vitest-environment node
import { describe, expect, it } from "vitest";
import seedData from "./seed-data.json";

describe("prisma/seed-data.json", () => {
  it("is a non-empty list of parties", () => {
    expect(Array.isArray(seedData)).toBe(true);
    expect(seedData.length).toBeGreaterThan(0);
  });

  it("gives every party a unique party-<n> id, a label and at least one member", () => {
    const ids = seedData.map((p) => p.partyId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const party of seedData) {
      expect(party.partyId).toMatch(/^party-\d+$/);
      expect(typeof party.label).toBe("string");
      expect(party.label.trim()).not.toBe("");
      expect(party.members.length).toBeGreaterThan(0);
    }
  });

  it("gives every member a non-empty, trimmed first and last name", () => {
    for (const party of seedData) {
      for (const m of party.members) {
        expect(Object.keys(m).sort()).toEqual(["firstName", "lastName"]);
        expect(m.firstName.trim()).toBe(m.firstName);
        expect(m.lastName.trim()).toBe(m.lastName);
        expect(m.firstName).not.toBe("");
        expect(m.lastName).not.toBe("");
      }
    }
  });

  it("does not list the same person twice within a party", () => {
    for (const party of seedData) {
      const names = party.members.map((m) => `${m.firstName} ${m.lastName}`);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
