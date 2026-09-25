import "dotenv/config";
import pg from "pg";
import { randomBytes } from "crypto";

// Usage:
//   node prisma/manage-guests.mjs list [partyId]
//   node prisma/manage-guests.mjs add <firstName> <lastName> <partyId>
//   node prisma/manage-guests.mjs remove <firstName> <lastName>
//   node prisma/manage-guests.mjs rename <firstName> <lastName> <newFirstName> <newLastName>

const cuid = () =>
  "c" + Date.now().toString(36) + randomBytes(8).toString("hex");

const [command, ...args] = process.argv.slice(2);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

async function findGuests(firstName, lastName) {
  const { rows } = await client.query(
    `SELECT "id", "firstName", "lastName", "partyId" FROM "Guest" WHERE "firstName" = $1 AND "lastName" = $2`,
    [firstName, lastName]
  );
  return rows;
}

switch (command) {
  case "list": {
    const [partyId] = args;
    const { rows } = partyId
      ? await client.query(
          `SELECT "firstName", "lastName", "partyId" FROM "Guest" WHERE "partyId" = $1 ORDER BY "createdAt"`,
          [partyId]
        )
      : await client.query(
          `SELECT "firstName", "lastName", "partyId" FROM "Guest" ORDER BY "partyId", "createdAt"`
        );
    console.table(rows);
    break;
  }

  case "add": {
    const [firstName, lastName, partyId] = args;
    if (!firstName || !lastName || !partyId) {
      console.error("Usage: add <firstName> <lastName> <partyId>");
      process.exit(1);
    }
    const existing = await findGuests(firstName, lastName);
    if (existing.length > 0) {
      console.log("Guest already exists:", existing);
      break;
    }
    await client.query(
      `INSERT INTO "Guest" ("id", "firstName", "lastName", "partyId", "updatedAt") VALUES ($1, $2, $3, $4, NOW())`,
      [cuid(), firstName, lastName, partyId]
    );
    console.log(`Added ${firstName} ${lastName} to ${partyId}`);
    break;
  }

  case "remove": {
    const [firstName, lastName] = args;
    if (!firstName || !lastName) {
      console.error("Usage: remove <firstName> <lastName>");
      process.exit(1);
    }
    const found = await findGuests(firstName, lastName);
    if (found.length === 0) {
      console.log(`No guest found matching ${firstName} ${lastName}`);
      break;
    }
    console.log("Removing:", found);
    const { rowCount } = await client.query(
      `DELETE FROM "Guest" WHERE "firstName" = $1 AND "lastName" = $2`,
      [firstName, lastName]
    );
    console.log(`Deleted ${rowCount} guest(s)`);
    break;
  }

  case "rename": {
    const [firstName, lastName, newFirstName, newLastName] = args;
    if (!firstName || !lastName || !newFirstName || !newLastName) {
      console.error("Usage: rename <firstName> <lastName> <newFirstName> <newLastName>");
      process.exit(1);
    }
    const found = await findGuests(firstName, lastName);
    if (found.length === 0) {
      console.log(`No guest found matching ${firstName} ${lastName}`);
      break;
    }
    const { rowCount } = await client.query(
      `UPDATE "Guest" SET "firstName" = $1, "lastName" = $2, "updatedAt" = NOW() WHERE "firstName" = $3 AND "lastName" = $4`,
      [newFirstName, newLastName, firstName, lastName]
    );
    console.log(`Renamed ${rowCount} guest(s) to ${newFirstName} ${newLastName}`);
    break;
  }

  default:
    console.error(
      `Unknown command: ${command ?? "(none)"}\n` +
        "Commands:\n" +
        "  list [partyId]\n" +
        "  add <firstName> <lastName> <partyId>\n" +
        "  remove <firstName> <lastName>\n" +
        "  rename <firstName> <lastName> <newFirstName> <newLastName>"
    );
    process.exit(1);
}

await client.end();
