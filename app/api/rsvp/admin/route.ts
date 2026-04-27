import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const guests = await prisma.guest.findMany({
      include: { rsvp: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const totalGuests = guests.length;
    const responded = guests.filter((g) => g.rsvp !== null).length;
    const notResponded = totalGuests - responded;

    const attendingWelcome = guests.filter((g) => g.rsvp?.welcomeParty).length;
    const attendingCeremony = guests.filter((g) => g.rsvp?.ceremony).length;
    const attendingReception = guests.filter((g) => g.rsvp?.reception).length;
    const attendingBrunch = guests.filter((g) => g.rsvp?.goodbyeBrunch).length;

    const meatCount = guests.filter(
      (g) => g.rsvp?.mealChoice === "MEAT"
    ).length;
    const vegetarianCount = guests.filter(
      (g) => g.rsvp?.mealChoice === "VEGETARIAN"
    ).length;

    return NextResponse.json({
      stats: {
        totalGuests,
        responded,
        notResponded,
        attendingWelcome,
        attendingCeremony,
        attendingReception,
        attendingBrunch,
        meatCount,
        vegetarianCount,
      },
      guests,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch RSVP data" },
      { status: 500 }
    );
  }
}
