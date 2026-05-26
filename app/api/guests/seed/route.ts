import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import seedData from "@/prisma/seed-data.json";

interface SeedMember {
  firstName: string;
  lastName: string;
}

interface SeedUnit {
  partyId: string;
  label: string;
  source: string;
  members: SeedMember[];
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const units = seedData as SeedUnit[];

    await prisma.rsvp.deleteMany();
    await prisma.guest.deleteMany();

    const guests = units.flatMap((unit) =>
      unit.members.map((member) => ({
        firstName: member.firstName,
        lastName: member.lastName,
        partyId: unit.partyId,
      }))
    );

    const created = await prisma.$transaction(
      guests.map((guest) => prisma.guest.create({ data: guest }))
    );

    return NextResponse.json({
      success: true,
      units: units.length,
      guests: created.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed guests" },
      { status: 500 }
    );
  }
}
