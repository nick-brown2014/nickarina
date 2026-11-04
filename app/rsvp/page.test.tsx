import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RsvpPage from "./page";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

const emptyRsvp = null;
const fred = { id: "g1", firstName: "Fred", lastName: "Porter", partyId: "party-1", rsvp: emptyRsvp };
const ingrid = { id: "g2", firstName: "Ingrid", lastName: "McMillan", partyId: "party-1", rsvp: emptyRsvp };
const phoebe = { id: "g3", firstName: "Phoebe", lastName: "Porter", partyId: "party-3", rsvp: emptyRsvp };

const partyOne = { partyId: "party-1", members: [fred, ingrid] };
const partyThree = { partyId: "party-3", members: [phoebe] };

async function search(lastName: string) {
  await userEvent.type(screen.getByLabelText("Last Name"), lastName);
  await userEvent.click(screen.getByRole("button", { name: "Find My Invitation" }));
}

function lastSubmitBody() {
  const call = fetchMock.mock.calls.find(([url]) => url === "/api/rsvp/submit");
  return JSON.parse(call![1].body);
}

// Each event row has its own Accept/Decline pair, in page order.
const accept = (i: number) => screen.getAllByRole("button", { name: "Accept" })[i];
const decline = (i: number) => screen.getAllByRole("button", { name: "Decline" })[i];

describe("RsvpPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  it("starts on the search step", () => {
    render(<RsvpPage />);
    expect(screen.getByText("Please enter your last name to find your invitation.")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeRequired();
  });

  it("searches by trimmed last name", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyOne] }));
    render(<RsvpPage />);
    await search("  Porter  ");
    expect(fetchMock).toHaveBeenCalledWith("/api/rsvp/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastName: "Porter" }),
    });
  });

  it("shows the API error when the search fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "We couldn’t find that name" }, false));
    render(<RsvpPage />);
    await search("Nobody");
    expect(await screen.findByText("We couldn’t find that name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
  });

  it("shows a generic error when the network fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<RsvpPage />);
    await search("Porter");
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find My Invitation" })).toBeEnabled();
  });

  it("disables the search button while searching", async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<RsvpPage />);
    await search("Porter");
    expect(screen.getByRole("button", { name: "Searching..." })).toBeDisabled();
    resolve(jsonResponse({ parties: [partyOne] }));
    expect(await screen.findByText("We found your group. Please confirm it below.")).toBeInTheDocument();
  });

  it("lists a single matching party with its member count", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyOne] }));
    render(<RsvpPage />);
    await search("Porter");
    expect(await screen.findByText("We found your group. Please confirm it below.")).toBeInTheDocument();
    expect(screen.getByText("Fred Porter, Ingrid McMillan")).toBeInTheDocument();
    expect(screen.getByText("2 guests")).toBeInTheDocument();
  });

  it("lists multiple parties and returns to search with Back", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyOne, partyThree] }));
    render(<RsvpPage />);
    await search("Porter");
    expect(await screen.findByText("We found multiple groups. Please select yours.")).toBeInTheDocument();
    expect(screen.getByText("1 guest")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Last Name")).toHaveValue("Porter");
  });

  it("steps through each member of the selected party", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyOne] }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Fred Porter, Ingrid McMillan"));

    expect(screen.getByText("Responding for Fred Porter (1 of 2)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit RSVP" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next Guest" }));
    expect(screen.getByText("Responding for Ingrid McMillan (2 of 2)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit RSVP" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Responding for Fred Porter (1 of 2)")).toBeInTheDocument();

    // Back on the first member of the only party returns to search.
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
  });

  it("goes back to party selection from the first member when there were several parties", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyOne, partyThree] }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("We found multiple groups. Please select yours.")).toBeInTheDocument();
  });

  it("shows shuttle and meal questions only for accepted events", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ parties: [partyThree] }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));

    const shuttleQ = /Will you be using the provided transportation/;
    expect(screen.queryByText(shuttleQ)).not.toBeInTheDocument();
    expect(screen.queryByText("Meal Selection")).not.toBeInTheDocument();

    await userEvent.click(accept(0));
    expect(screen.getAllByText(shuttleQ)).toHaveLength(1);

    await userEvent.click(accept(1));
    expect(screen.getAllByText(shuttleQ)).toHaveLength(2);
    expect(screen.getByText("Meal Selection")).toBeInTheDocument();

    await userEvent.click(decline(1));
    expect(screen.getAllByText(shuttleQ)).toHaveLength(1);
    expect(screen.queryByText("Meal Selection")).not.toBeInTheDocument();

    await userEvent.click(decline(0));
    expect(screen.queryByText(shuttleQ)).not.toBeInTheDocument();
  });

  it("submits every member's answers and shows the confirmation summary", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyOne] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Fred Porter, Ingrid McMillan"));

    // Fred: welcome party w/ shuttle, ceremony w/ vegetarian, no shuttle, brunch.
    await userEvent.click(accept(0));
    await userEvent.click(screen.getAllByRole("button", { name: "Yes" })[0]);
    await userEvent.click(accept(1));
    await userEvent.click(screen.getAllByRole("button", { name: "No" })[1]);
    await userEvent.click(screen.getByRole("button", { name: "Vegetarian" }));
    await userEvent.click(accept(2));
    await userEvent.type(screen.getByLabelText("Dietary Restrictions or Notes"), "No nuts");

    // Ingrid: declines everything.
    await userEvent.click(screen.getByRole("button", { name: "Next Guest" }));
    expect(screen.getByLabelText("Dietary Restrictions or Notes")).toHaveValue("");
    await userEvent.click(decline(0));
    await userEvent.click(decline(1));
    await userEvent.click(decline(2));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));

    expect(await screen.findByText("Response Recorded")).toBeInTheDocument();
    expect(lastSubmitBody()).toEqual({
      rsvps: [
        {
          guestId: "g1",
          welcomeParty: true,
          welcomePartyShuttle: true,
          ceremony: true,
          ceremonyShuttle: false,
          reception: true,
          goodbyeBrunch: true,
          mealChoice: "VEGETARIAN",
          dietaryNotes: "No nuts",
        },
        {
          guestId: "g2",
          welcomeParty: false,
          welcomePartyShuttle: false,
          ceremony: false,
          ceremonyShuttle: false,
          reception: false,
          goodbyeBrunch: false,
          mealChoice: null,
          dietaryNotes: "",
        },
      ],
    });

    expect(screen.getByText("We can't wait to celebrate with you.")).toBeInTheDocument();
    expect(screen.getByText(/Welcome Party - Attending \(\s*Shuttle needed\s*\)/)).toBeInTheDocument();
    expect(screen.getByText(/Ceremony & Reception - Attending \(\s*Vegetarian\s*,\s*no shuttle\s*\)/)).toBeInTheDocument();
    expect(screen.getByText("Goodbye Brunch - Attending")).toBeInTheDocument();
    expect(screen.getByText("Unable to attend")).toBeInTheDocument();
  });

  it("clears the meal choice when the ceremony is declined after choosing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyThree] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(accept(1));
    await userEvent.click(screen.getByRole("button", { name: "Meat" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Yes" })[0]);
    await userEvent.click(decline(1));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));

    await screen.findByText("Response Recorded");
    expect(lastSubmitBody().rsvps[0]).toMatchObject({
      ceremony: false,
      reception: false,
      mealChoice: null,
      ceremonyShuttle: false,
    });
    expect(screen.queryByText("We can't wait to celebrate with you.")).not.toBeInTheDocument();
  });

  it("prefills answers from an existing RSVP", async () => {
    const returning = {
      ...phoebe,
      rsvp: {
        welcomeParty: true,
        welcomePartyShuttle: false,
        ceremony: true,
        ceremonyShuttle: true,
        reception: true,
        goodbyeBrunch: false,
        mealChoice: "MEAT" as const,
        dietaryNotes: "Shellfish",
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [{ partyId: "party-3", members: [returning] }] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));

    expect(screen.getByText("Meal Selection")).toBeInTheDocument();
    expect(screen.getByLabelText("Dietary Restrictions or Notes")).toHaveValue("Shellfish");
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));
    await screen.findByText("Response Recorded");
    expect(lastSubmitBody().rsvps[0]).toEqual({ guestId: "g3", ...returning.rsvp });
  });

  it("shows the API error when submission fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyThree] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Failed to save RSVP. Please try again." }, false));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));
    expect(await screen.findByText("Failed to save RSVP. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Response Recorded")).not.toBeInTheDocument();
  });

  it("falls back to a default message when the submit error has no body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyThree] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));
    expect(await screen.findByText("Failed to save RSVP. Please try again.")).toBeInTheDocument();
  });

  it("shows a generic error when the submit request throws", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyThree] }));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit RSVP" })).toBeEnabled());
  });

  it("resets to an empty search after 'RSVP for Another Guest'", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ parties: [partyThree] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    render(<RsvpPage />);
    await search("Porter");
    await userEvent.click(await screen.findByText("Phoebe Porter"));
    await userEvent.click(screen.getByRole("button", { name: "Submit RSVP" }));
    await userEvent.click(await screen.findByRole("button", { name: "RSVP for Another Guest" }));
    expect(screen.getByLabelText("Last Name")).toHaveValue("");
  });
});
