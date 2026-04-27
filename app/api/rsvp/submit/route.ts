import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface RsvpData {
  guestId: string;
  welcomeParty: boolean;
  ceremony: boolean;
  reception: boolean;
  goodbyeBrunch: boolean;
  mealChoice: "MEAT" | "VEGETARIAN" | null;
  dietaryNotes: string;
}

export async function POST(request: Request) {
  try {
    const { rsvps } = (await request.json()) as { rsvps: RsvpData[] };

    if (!rsvps || !Array.isArray(rsvps) || rsvps.length === 0) {
      return NextResponse.json(
        { error: "No RSVP data provided" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      rsvps.map((rsvp) =>
        prisma.rsvp.upsert({
          where: { guestId: rsvp.guestId },
          update: {
            welcomeParty: rsvp.welcomeParty,
            ceremony: rsvp.ceremony,
            reception: rsvp.reception,
            goodbyeBrunch: rsvp.goodbyeBrunch,
            mealChoice: rsvp.ceremony || rsvp.reception ? rsvp.mealChoice : null,
            dietaryNotes: rsvp.dietaryNotes || null,
            submittedAt: new Date(),
          },
          create: {
            guestId: rsvp.guestId,
            welcomeParty: rsvp.welcomeParty,
            ceremony: rsvp.ceremony,
            reception: rsvp.reception,
            goodbyeBrunch: rsvp.goodbyeBrunch,
            mealChoice: rsvp.ceremony || rsvp.reception ? rsvp.mealChoice : null,
            dietaryNotes: rsvp.dietaryNotes || null,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to save RSVP. Please try again." },
      { status: 500 }
    );
  }
}
