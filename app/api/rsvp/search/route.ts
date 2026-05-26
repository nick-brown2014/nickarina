import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { lastName } = await request.json();

    if (!lastName || !lastName.trim()) {
      return NextResponse.json(
        { error: "Please enter your last name" },
        { status: 400 }
      );
    }

    const guests = await prisma.guest.findMany({
      where: {
        lastName: { equals: lastName.trim(), mode: "insensitive" },
      },
      include: { rsvp: true },
      orderBy: [{ partyId: "asc" }, { firstName: "asc" }],
    });

    if (guests.length === 0) {
      return NextResponse.json(
        {
          error:
            "We couldn\u2019t find that name on our guest list. Please double-check the spelling or contact the couple for assistance.",
        },
        { status: 404 }
      );
    }

    const partyMap = new Map<
      string,
      { partyId: string; members: typeof guests }
    >();
    for (const guest of guests) {
      if (!partyMap.has(guest.partyId)) {
        partyMap.set(guest.partyId, { partyId: guest.partyId, members: [] });
      }
      partyMap.get(guest.partyId)!.members.push(guest);
    }

    const parties = Array.from(partyMap.values());

    for (const party of parties) {
      const allMembers = await prisma.guest.findMany({
        where: { partyId: party.partyId },
        include: { rsvp: true },
        orderBy: [{ firstName: "asc" }],
      });
      party.members = allMembers;
    }

    return NextResponse.json({ parties });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
