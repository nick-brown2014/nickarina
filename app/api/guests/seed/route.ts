import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const SAMPLE_GUESTS = [
  { firstName: "John", lastName: "Smith", partyId: "party-1" },
  { firstName: "Jane", lastName: "Smith", partyId: "party-1" },
  { firstName: "Michael", lastName: "Johnson", partyId: "party-2" },
  { firstName: "Sarah", lastName: "Williams", partyId: "party-3" },
  { firstName: "David", lastName: "Williams", partyId: "party-3" },
  { firstName: "Emily", lastName: "Brown", partyId: "party-4" },
];

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding is not allowed in production" },
      { status: 403 }
    );
  }

  try {
    const created = await prisma.$transaction(
      SAMPLE_GUESTS.map((guest) =>
        prisma.guest.create({ data: guest })
      )
    );

    return NextResponse.json({ success: true, count: created.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to seed guests" },
      { status: 500 }
    );
  }
}
