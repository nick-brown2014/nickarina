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

    const result = await prisma.$transaction(async (tx) => {
      const existingGuests = await tx.guest.findMany({
        orderBy: [{ partyId: "asc" }, { createdAt: "asc" }],
      });
      const guestsByParty = new Map<string, typeof existingGuests>();

      for (const guest of existingGuests) {
        const partyGuests = guestsByParty.get(guest.partyId) ?? [];
        partyGuests.push(guest);
        guestsByParty.set(guest.partyId, partyGuests);
      }

      let created = 0;
      let updated = 0;
      let unchanged = 0;
      const extras: { partyId: string; name: string }[] = [];

      for (const unit of units) {
        const availableGuests = guestsByParty.get(unit.partyId) ?? [];

        for (const member of unit.members) {
          const firstName = member.firstName.toLowerCase();
          const lastName = member.lastName.toLowerCase();
          const firstNameIndex = availableGuests.findIndex(
            (guest) => guest.firstName.toLowerCase() === firstName
          );
          const lastNameIndex = availableGuests.findIndex(
            (guest) => guest.lastName.toLowerCase() === lastName
          );
          const matchIndex =
            firstNameIndex >= 0
              ? firstNameIndex
              : lastNameIndex >= 0
                ? lastNameIndex
                : 0;
          const existingGuest = availableGuests.splice(matchIndex, 1)[0];

          if (!existingGuest) {
            await tx.guest.create({
              data: {
                firstName: member.firstName,
                lastName: member.lastName,
                partyId: unit.partyId,
              },
            });
            created++;
          } else if (
            existingGuest.firstName !== member.firstName ||
            existingGuest.lastName !== member.lastName
          ) {
            await tx.guest.update({
              where: { id: existingGuest.id },
              data: {
                firstName: member.firstName,
                lastName: member.lastName,
              },
            });
            updated++;
          } else {
            unchanged++;
          }
        }

        extras.push(
          ...availableGuests.map((guest) => ({
            partyId: guest.partyId,
            name: `${guest.firstName} ${guest.lastName}`,
          }))
        );
        guestsByParty.delete(unit.partyId);
      }

      extras.push(
        ...[...guestsByParty.values()].flatMap((guests) =>
          guests.map((guest) => ({
            partyId: guest.partyId,
            name: `${guest.firstName} ${guest.lastName}`,
          }))
        )
      );

      return { created, updated, unchanged, extras };
    });

    return NextResponse.json({
      success: true,
      units: units.length,
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      extras: result.extras,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed guests" },
      { status: 500 }
    );
  }
}
