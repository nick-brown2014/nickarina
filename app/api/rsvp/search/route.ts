import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { firstName, lastName } = await request.json();

    if (!firstName && !lastName) {
      return NextResponse.json(
        { error: "Please provide a name to search" },
        { status: 400 }
      );
    }

    const guests = await prisma.guest.findMany({
      where: {
        AND: [
          firstName
            ? { firstName: { equals: firstName, mode: "insensitive" } }
            : {},
          lastName
            ? { lastName: { equals: lastName, mode: "insensitive" } }
            : {},
        ],
      },
      include: { rsvp: true },
    });

    if (guests.length === 0) {
      return NextResponse.json(
        { error: "No guests found with that name. Please try again or contact the couple for assistance." },
        { status: 404 }
      );
    }

    const partyIds = [...new Set(guests.map((g) => g.partyId))];
    const partyMembers = await prisma.guest.findMany({
      where: { partyId: { in: partyIds } },
      include: { rsvp: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ guests: partyMembers });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
