// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { PrismaClientMock, PrismaPgMock } = vi.hoisted(() => ({
  PrismaClientMock: vi.fn(function (this: Record<string, unknown>, opts: unknown) {
    this.opts = opts;
  }),
  PrismaPgMock: vi.fn(function (this: Record<string, unknown>, opts: unknown) {
    this.adapterOpts = opts;
  }),
}));

vi.mock("@/app/generated/prisma/client", () => ({ PrismaClient: PrismaClientMock }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: PrismaPgMock }));

const globalForPrisma = globalThis as unknown as { prisma?: unknown };

describe("app/lib/prisma", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalForPrisma.prisma;
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
  });

  afterEach(() => {
    delete globalForPrisma.prisma;
  });

  it("creates a client with a PrismaPg adapter using DATABASE_URL", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { prisma } = await import("./prisma");

    expect(PrismaPgMock).toHaveBeenCalledWith({
      connectionString: "postgresql://test:test@localhost:5432/test",
    });
    expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    const adapter = PrismaPgMock.mock.instances[0];
    expect(PrismaClientMock).toHaveBeenCalledWith({ adapter });
    expect(prisma).toBe(PrismaClientMock.mock.instances[0]);
  });

  it("caches the client on globalThis outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { prisma } = await import("./prisma");
    expect(globalForPrisma.prisma).toBe(prisma);
  });

  it("reuses an existing global client instead of creating a new one", async () => {
    const existing = { existing: true };
    globalForPrisma.prisma = existing;
    const { prisma } = await import("./prisma");
    expect(prisma).toBe(existing);
    expect(PrismaClientMock).not.toHaveBeenCalled();
  });

  it("does not cache on globalThis in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await import("./prisma");
    expect(globalForPrisma.prisma).toBeUndefined();
  });
});
