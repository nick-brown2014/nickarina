import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const guests = await prisma.guest.findMany({
      include: { rsvp: true },
    });

    const totalGuests = guests.length;
    const responded = guests.filter((g) => g.rsvp !== null).length;

    const attendingWelcome = guests.filter((g) => g.rsvp?.welcomeParty).length;
    const attendingCeremony = guests.filter((g) => g.rsvp?.ceremony).length;
    const attendingReception = guests.filter((g) => g.rsvp?.reception).length;
    const attendingBrunch = guests.filter((g) => g.rsvp?.goodbyeBrunch).length;

    return NextResponse.json({
      stats: {
        totalGuests,
        responded,
        attendingWelcome,
        attendingCeremony,
        attendingReception,
        attendingBrunch,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch RSVP stats" },
      { status: 500 }
    );
  }
}
