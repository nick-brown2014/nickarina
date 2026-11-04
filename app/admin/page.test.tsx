import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const rsvp = (overrides: Record<string, unknown> = {}) => ({
  welcomeParty: null,
  welcomePartyShuttle: null,
  ceremony: null,
  ceremonyShuttle: null,
  reception: null,
  goodbyeBrunch: null,
  mealChoice: null,
  dietaryNotes: null,
  submittedAt: "2026-09-01T12:00:00.000Z",
  ...overrides,
});

const guests = [
  {
    id: "g1",
    firstName: "Fred",
    lastName: "Porter",
    partyId: "party-1",
    rsvp: rsvp({
      welcomeParty: true,
      welcomePartyShuttle: true,
      ceremony: true,
      ceremonyShuttle: false,
      reception: true,
      goodbyeBrunch: false,
      mealChoice: "VEGETARIAN",
      dietaryNotes: 'Says "no nuts"',
    }),
  },
  { id: "g2", firstName: "Ingrid", lastName: "McMillan", partyId: "party-1", rsvp: null },
  {
    id: "g3",
    firstName: "Helena",
    lastName: "Ernst",
    partyId: "party-2",
    rsvp: rsvp({ welcomeParty: false, ceremony: false, reception: false, goodbyeBrunch: false }),
  },
];

const stats = {
  totalGuests: 3,
  responded: 2,
  notResponded: 1,
  attendingWelcome: 1,
  attendingCeremony: 1,
  attendingReception: 1,
  attendingBrunch: 0,
  welcomeShuttleCount: 1,
  ceremonyShuttleCount: 0,
  meatCount: 0,
  vegetarianCount: 1,
};

async function login(secret = "s3cret") {
  await userEvent.type(screen.getByLabelText("Admin Secret"), secret);
  await userEvent.click(screen.getByRole("button", { name: "Access Dashboard" }));
}

async function loginToDashboard() {
  fetchMock.mockResolvedValueOnce(jsonResponse({ guests, stats }));
  render(<AdminPage />);
  await login();
  await screen.findByText("RSVP Dashboard");
}

const rowNames = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("cell")[0].textContent);

// jsdom's Blob has no .text(), so read it the old-fashioned way.
function readBlob(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

const statValue = (label: string) =>
  screen.getByText(label, { selector: "p" }).previousElementSibling?.textContent;

describe("AdminPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("login", () => {
    it("sends the secret as a bearer token", async () => {
      await loginToDashboard();
      expect(fetchMock).toHaveBeenCalledWith("/api/rsvp/admin", {
        headers: { Authorization: "Bearer s3cret" },
      });
    });

    it("shows an error for an invalid secret", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Unauthorized" }, 401));
      render(<AdminPage />);
      await login("wrong");
      expect(await screen.findByText("Invalid admin secret.")).toBeInTheDocument();
      expect(screen.queryByText("RSVP Dashboard")).not.toBeInTheDocument();
    });

    it("shows the API error for other failures", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Failed to fetch RSVP data" }, 500));
      render(<AdminPage />);
      await login();
      expect(await screen.findByText("Failed to fetch RSVP data")).toBeInTheDocument();
    });

    it("shows a connection error when the request throws", async () => {
      fetchMock.mockRejectedValueOnce(new Error("offline"));
      render(<AdminPage />);
      await login();
      expect(await screen.findByText("Failed to connect. Please try again.")).toBeInTheDocument();
    });
  });

  describe("dashboard", () => {
    it("renders stats including the response rate", async () => {
      await loginToDashboard();
      expect(statValue("Total Guests")).toBe("3");
      expect(statValue("Responded")).toBe("2");
      expect(statValue("Awaiting")).toBe("1");
      expect(statValue("Response Rate")).toBe("67%");
      expect(statValue("Vegetarian")).toBe("1");
    });

    it("shows 0% response rate with no guests", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ guests: [], stats: { ...stats, totalGuests: 0, responded: 0 } }));
      render(<AdminPage />);
      await login();
      await screen.findByText("RSVP Dashboard");
      expect(statValue("Response Rate")).toBe("0%");
      expect(screen.getByText("No guests match the current filter.")).toBeInTheDocument();
    });

    it("renders a row per guest with badges, meal and notes", async () => {
      await loginToDashboard();
      expect(rowNames()).toEqual(["Fred Porter", "Ingrid McMillan", "Helena Ernst"]);
      const fredRow = screen.getAllByRole("row")[1];
      expect(within(fredRow).getByText("Vegetarian")).toBeInTheDocument();
      expect(within(fredRow).getAllByText("Yes")).toHaveLength(4);
      expect(within(fredRow).getAllByText("No")).toHaveLength(2);
    });

    it.each([
      ["responded", ["Fred Porter", "Helena Ernst"]],
      ["not responded", ["Ingrid McMillan"]],
      ["attending", ["Fred Porter"]],
      ["declined", ["Helena Ernst"]],
      ["all", ["Fred Porter", "Ingrid McMillan", "Helena Ernst"]],
    ])("filters by %s", async (label, expected) => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: label }));
      expect(rowNames()).toEqual(expected);
    });

    it("shows a tooltip with full dietary notes on hover", async () => {
      await loginToDashboard();
      const trigger = screen.getAllByText('Says "no nuts"')[0];
      fireEvent.mouseEnter(trigger);
      expect(screen.getByRole("tooltip")).toHaveTextContent('Says "no nuts"');
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("exports the filtered guests to CSV", async () => {
      const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:csv");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal(
        "URL",
        class extends URL {
          static createObjectURL = createObjectURL;
          static revokeObjectURL = revokeObjectURL;
        }
      );
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "responded" }));
      await userEvent.click(screen.getByRole("button", { name: /Export CSV/ }));

      expect(click).toHaveBeenCalledTimes(1);
      const link = click.mock.contexts[0] as HTMLAnchorElement;
      expect(link.download).toMatch(/^rsvp-export-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");

      const csv = await readBlob(createObjectURL.mock.calls[0][0]);
      const lines = csv.split("\n");
      expect(lines[0]).toBe(
        "First Name,Last Name,Party ID,Welcome Party,Welcome Shuttle,Ceremony,Ceremony Shuttle,Reception,Goodbye Brunch,Meal Choice,Dietary Notes,Submitted At"
      );
      expect(lines).toHaveLength(3);
      expect(lines[1]).toContain(
        '"Fred","Porter","party-1","Yes","Yes","Yes","No","Yes","No","VEGETARIAN","Says ""no nuts"""'
      );
      expect(lines[2]).toContain('"Helena","Ernst","party-2","No","N/A","No","N/A","No","No","N/A",""');
    });
  });

  describe("guest modal", () => {
    it("validates required fields when adding a guest", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "+ Add Guest" }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Add Guest")).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
      expect(within(dialog).getByText("First name, last name, and party are required.")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("creates a guest, patches it, then reloads the dashboard", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "+ Add Guest" }));
      const dialog = screen.getByRole("dialog");
      const [first, last, party] = within(dialog).getAllByRole("textbox");
      await userEvent.type(first, "Ada");
      await userEvent.type(last, "Lovelace");
      await userEvent.type(party, "party-9");

      fetchMock
        .mockResolvedValueOnce(jsonResponse({ guest: { id: "new-id" } }))
        .mockResolvedValueOnce(jsonResponse({ guest: { id: "new-id" } }))
        .mockResolvedValueOnce(jsonResponse({ guests, stats }));
      await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      const [, postCall, patchCall, reload] = fetchMock.mock.calls;
      expect(postCall[1].method).toBe("POST");
      expect(postCall[1].headers.Authorization).toBe("Bearer s3cret");
      expect(JSON.parse(postCall[1].body)).toEqual({ firstName: "Ada", lastName: "Lovelace", partyId: "party-9" });
      expect(patchCall[1].method).toBe("PATCH");
      expect(JSON.parse(patchCall[1].body)).toEqual({
        id: "new-id",
        firstName: "Ada",
        lastName: "Lovelace",
        partyId: "party-9",
      });
      expect(reload[1]).toEqual({ headers: { Authorization: "Bearer s3cret" } });
    });

    it("shows the error when creating fails", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "+ Add Guest" }));
      const dialog = screen.getByRole("dialog");
      const [first, last, party] = within(dialog).getAllByRole("textbox");
      await userEvent.type(first, "A");
      await userEvent.type(last, "B");
      await userEvent.type(party, "p");
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Failed to create guest" }, 500));
      await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
      expect(await within(dialog).findByText("Failed to create guest")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("edits an existing guest's RSVP", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Fred Porter" }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Edit Guest")).toBeInTheDocument();

      const selects = within(dialog).getAllByRole("combobox");
      await userEvent.selectOptions(selects[5], "yes");
      await userEvent.selectOptions(selects[6], "MEAT");
      const notes = within(dialog).getAllByRole("textbox")[3];
      await userEvent.clear(notes);

      fetchMock
        .mockResolvedValueOnce(jsonResponse({ guest: {} }))
        .mockResolvedValueOnce(jsonResponse({ guests, stats }));
      await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      const patch = fetchMock.mock.calls[1];
      expect(patch[1].method).toBe("PATCH");
      expect(JSON.parse(patch[1].body)).toEqual({
        id: "g1",
        firstName: "Fred",
        lastName: "Porter",
        partyId: "party-1",
        rsvp: {
          welcomeParty: true,
          welcomePartyShuttle: true,
          ceremony: true,
          ceremonyShuttle: false,
          reception: true,
          goodbyeBrunch: true,
          mealChoice: "MEAT",
          dietaryNotes: null,
        },
      });
    });

    it("shows the error when saving an existing guest fails", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Ingrid McMillan" }));
      const dialog = screen.getByRole("dialog");
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
      await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
      expect(await within(dialog).findByText("Failed to save guest.")).toBeInTheDocument();
      expect(JSON.parse(fetchMock.mock.calls[1][1].body).rsvp).toBeUndefined();
    });

    it("deletes a guest after confirmation", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Helena Ernst" }));
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockResolvedValueOnce(jsonResponse({ guests, stats }));
      await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Remove Helena Ernst"));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(fetchMock.mock.calls[1][1]).toMatchObject({
        method: "DELETE",
        body: JSON.stringify({ id: "g3" }),
      });
    });

    it("does nothing when deletion is not confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Helena Ernst" }));
      await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("shows the error when deletion fails", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Helena Ernst" }));
      fetchMock.mockRejectedValueOnce(new Error("offline"));
      const dialog = screen.getByRole("dialog");
      await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
      expect(await within(dialog).findByText("Failed to delete. Please try again.")).toBeInTheDocument();
    });

    it("closes on Cancel and on backdrop click, but not on dialog click", async () => {
      await loginToDashboard();
      await userEvent.click(screen.getByRole("button", { name: "Fred Porter" }));
      await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Fred Porter" }));
      const dialog = screen.getByRole("dialog");
      await userEvent.click(dialog);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await userEvent.click(dialog.parentElement!);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
