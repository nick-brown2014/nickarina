import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function isAuthorized() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && authHeader === `Bearer ${adminSecret}`);
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await isAuthorized())) {
    return unauthorized();
  }

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

    const welcomeShuttleCount = guests.filter(
      (g) => g.rsvp?.welcomePartyShuttle
    ).length;
    const ceremonyShuttleCount = guests.filter(
      (g) => g.rsvp?.ceremonyShuttle
    ).length;

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
        welcomeShuttleCount,
        ceremonyShuttleCount,
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

interface RsvpInput {
  welcomeParty: boolean | null;
  welcomePartyShuttle: boolean | null;
  ceremony: boolean | null;
  ceremonyShuttle: boolean | null;
  reception: boolean | null;
  goodbyeBrunch: boolean | null;
  mealChoice: "MEAT" | "VEGETARIAN" | null;
  dietaryNotes: string | null;
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return unauthorized();
  }

  try {
    const { firstName, lastName, partyId } = await request.json();
    if (!firstName?.trim() || !lastName?.trim() || !partyId?.trim()) {
      return NextResponse.json(
        { error: "firstName, lastName, and partyId are required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        partyId: partyId.trim(),
      },
      include: { rsvp: true },
    });
    return NextResponse.json({ guest });
  } catch {
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized())) {
    return unauthorized();
  }

  try {
    const { id, firstName, lastName, partyId, rsvp } = (await request.json()) as {
      id: string;
      firstName?: string;
      lastName?: string;
      partyId?: string;
      rsvp?: RsvpInput | null;
    };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: { firstName?: string; lastName?: string; partyId?: string } =
      {};
    if (firstName?.trim()) data.firstName = firstName.trim();
    if (lastName?.trim()) data.lastName = lastName.trim();
    if (partyId?.trim()) data.partyId = partyId.trim();

    await prisma.guest.update({ where: { id }, data });

    if (rsvp) {
      const rsvpData = {
        welcomeParty: rsvp.welcomeParty,
        welcomePartyShuttle: rsvp.welcomePartyShuttle,
        ceremony: rsvp.ceremony,
        ceremonyShuttle: rsvp.ceremonyShuttle,
        reception: rsvp.reception,
        goodbyeBrunch: rsvp.goodbyeBrunch,
        mealChoice: rsvp.mealChoice,
        dietaryNotes: rsvp.dietaryNotes?.trim() || null,
      };
      await prisma.rsvp.upsert({
        where: { guestId: id },
        create: { guestId: id, ...rsvpData },
        update: rsvpData,
      });
    } else if (rsvp === null) {
      await prisma.rsvp.deleteMany({ where: { guestId: id } });
    }

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { rsvp: true },
    });
    return NextResponse.json({ guest });
  } catch {
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized())) {
    return unauthorized();
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete guest" },
      { status: 500 }
    );
  }
}
