"use client";

import { useState } from "react";

interface GuestRsvp {
  guestId: string;
  welcomeParty: boolean;
  ceremony: boolean;
  reception: boolean;
  goodbyeBrunch: boolean;
  mealChoice: "MEAT" | "VEGETARIAN" | null;
  dietaryNotes: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  partyId: string;
  rsvp: {
    welcomeParty: boolean | null;
    ceremony: boolean | null;
    reception: boolean | null;
    goodbyeBrunch: boolean | null;
    mealChoice: "MEAT" | "VEGETARIAN" | null;
    dietaryNotes: string | null;
  } | null;
}

interface Party {
  partyId: string;
  members: Guest[];
}

type Step = "search" | "select-party" | "rsvp" | "confirmation";

export default function RsvpPage() {
  const [step, setStep] = useState<Step>("search");
  const [lastName, setLastName] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, GuestRsvp>>({});
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setIsSearching(true);

    try {
      const res = await fetch("/api/rsvp/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName: lastName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error);
        return;
      }

      const foundParties = data.parties as Party[];
      setParties(foundParties);

      if (foundParties.length === 1) {
        selectParty(foundParties[0]);
      } else {
        setStep("select-party");
      }
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectParty = (party: Party) => {
    setSelectedParty(party);
    const initialRsvps: Record<string, GuestRsvp> = {};
    for (const guest of party.members) {
      initialRsvps[guest.id] = {
        guestId: guest.id,
        welcomeParty: guest.rsvp?.welcomeParty ?? false,
        ceremony: guest.rsvp?.ceremony ?? false,
        reception: guest.rsvp?.reception ?? false,
        goodbyeBrunch: guest.rsvp?.goodbyeBrunch ?? false,
        mealChoice: guest.rsvp?.mealChoice ?? null,
        dietaryNotes: guest.rsvp?.dietaryNotes ?? "",
      };
    }
    setRsvps(initialRsvps);
    setCurrentMemberIndex(0);
    setStep("rsvp");
  };

  const updateRsvp = (
    guestId: string,
    field: keyof GuestRsvp,
    value: boolean | string | null
  ) => {
    setRsvps((prev) => ({
      ...prev,
      [guestId]: { ...prev[guestId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvps: Object.values(rsvps) }),
      });

      if (res.ok) {
        setStep("confirmation");
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to save RSVP. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const members = selectedParty?.members ?? [];
  const currentGuest = members[currentMemberIndex];
  const isLastMember = currentMemberIndex === members.length - 1;
  const isFirstMember = currentMemberIndex === 0;

  const anyAttending = Object.values(rsvps).some(
    (r) => r.welcomeParty || r.ceremony || r.reception || r.goodbyeBrunch
  );

  const stepDescription: Record<Step, string> = {
    search: "Please enter your last name to find your invitation.",
    "select-party": "We found multiple groups. Please select yours.",
    rsvp: currentGuest
      ? `Responding for ${currentGuest.firstName}${currentGuest.lastName ? ` ${currentGuest.lastName}` : ""} (${currentMemberIndex + 1} of ${members.length})`
      : "",
    confirmation: "Thank you for your response!",
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-cinzel)] text-4xl md:text-5xl tracking-wider text-foreground mb-4">
            RSVP
          </h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted text-lg">{stepDescription[step]}</p>
        </div>

        {step === "search" && (
          <form
            onSubmit={handleSearch}
            autoComplete="off"
            className="space-y-6 max-w-md mx-auto"
          >
            <div>
              <label
                htmlFor="lastName"
                className="block font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-2 uppercase"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="off"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-transparent border border-accent/30 px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors"
                placeholder="Enter your last name"
                required
              />
            </div>

            {searchError && (
              <p className="text-red-400 text-sm text-center">{searchError}</p>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="w-full font-[var(--font-cinzel)] cursor-pointer text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Find My Invitation"}
            </button>
          </form>
        )}

        {step === "select-party" && (
          <div className="space-y-4 max-w-md mx-auto">
            {parties.map((party) => (
              <button
                key={party.partyId}
                onClick={() => selectParty(party)}
                className="w-full text-left border border-accent/30 p-5 hover:border-accent-light hover:bg-accent-light/5 transition-all duration-200"
              >
                <p className="font-[var(--font-cinzel)] text-lg tracking-wider text-accent-light mb-1">
                  {party.members
                    .map(
                      (m) =>
                        `${m.firstName}${m.lastName ? ` ${m.lastName}` : ""}`
                    )
                    .join(", ")}
                </p>
                <p className="text-muted text-sm">
                  {party.members.length}{" "}
                  {party.members.length === 1 ? "guest" : "guests"}
                </p>
              </button>
            ))}

            <button
              onClick={() => {
                setStep("search");
                setParties([]);
              }}
              className="w-full font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent/40 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-300 mt-6"
            >
              Back
            </button>
          </div>
        )}

        {step === "rsvp" && currentGuest && (
          <div className="space-y-10">
            {members.length > 1 && (
              <div className="flex justify-center gap-2 mb-4">
                {members.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentMemberIndex
                        ? "bg-accent-light scale-125"
                        : i < currentMemberIndex
                          ? "bg-accent-light/50"
                          : "bg-accent/30"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="border border-accent/20 p-6 md:p-8">
              <h2 className="font-[var(--font-cinzel)] text-2xl tracking-wider text-accent-light mb-6">
                {currentGuest.firstName}
                {currentGuest.lastName ? ` ${currentGuest.lastName}` : ""}
              </h2>

              <div className="space-y-6">
                <EventToggle
                  label="Welcome Party"
                  sublabel="October 30, 2026"
                  checked={rsvps[currentGuest.id]?.welcomeParty}
                  onChange={(v) =>
                    updateRsvp(currentGuest.id, "welcomeParty", v)
                  }
                />
                <EventToggle
                  label="Ceremony & Reception"
                  sublabel="October 31, 2026"
                  checked={rsvps[currentGuest.id]?.ceremony}
                  onChange={(v) => {
                    updateRsvp(currentGuest.id, "ceremony", v);
                    updateRsvp(currentGuest.id, "reception", v);
                    if (!v) updateRsvp(currentGuest.id, "mealChoice", null);
                  }}
                />
                <EventToggle
                  label="Goodbye Brunch"
                  sublabel="November 1, 2026"
                  checked={rsvps[currentGuest.id]?.goodbyeBrunch}
                  onChange={(v) =>
                    updateRsvp(currentGuest.id, "goodbyeBrunch", v)
                  }
                />

                {(rsvps[currentGuest.id]?.ceremony ||
                  rsvps[currentGuest.id]?.reception) && (
                  <div className="pt-4 border-t border-accent/10">
                    <p className="font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-4 uppercase">
                      Meal Selection
                    </p>
                    <div className="flex gap-4">
                      <MealOption
                        label="Meat"
                        selected={
                          rsvps[currentGuest.id]?.mealChoice === "MEAT"
                        }
                        onSelect={() =>
                          updateRsvp(currentGuest.id, "mealChoice", "MEAT")
                        }
                      />
                      <MealOption
                        label="Vegetarian"
                        selected={
                          rsvps[currentGuest.id]?.mealChoice === "VEGETARIAN"
                        }
                        onSelect={() =>
                          updateRsvp(
                            currentGuest.id,
                            "mealChoice",
                            "VEGETARIAN"
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-accent/10">
                  <label
                    htmlFor={`dietary-${currentGuest.id}`}
                    className="block font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-2 uppercase"
                  >
                    Dietary Restrictions or Notes
                  </label>
                  <textarea
                    id={`dietary-${currentGuest.id}`}
                    value={rsvps[currentGuest.id]?.dietaryNotes ?? ""}
                    onChange={(e) =>
                      updateRsvp(
                        currentGuest.id,
                        "dietaryNotes",
                        e.target.value
                      )
                    }
                    className="w-full bg-transparent border border-accent/30 px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors resize-none"
                    rows={2}
                    placeholder="Any allergies or dietary requirements..."
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <p className="text-red-400 text-sm text-center">{submitError}</p>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  if (isFirstMember) {
                    if (parties.length > 1) {
                      setStep("select-party");
                    } else {
                      setStep("search");
                    }
                  } else {
                    setCurrentMemberIndex((i) => i - 1);
                  }
                }}
                className="flex-1 font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent/40 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-300"
              >
                Back
              </button>
              {isLastMember ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit RSVP"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentMemberIndex((i) => i + 1)}
                  className="flex-1 font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
                >
                  Next Guest
                </button>
              )}
            </div>
          </div>
        )}

        {step === "confirmation" && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 mx-auto border border-accent-light rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-accent-light"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h2 className="font-[var(--font-cinzel)] text-2xl tracking-wider text-accent-light mb-4">
                Response Recorded
              </h2>
              <p className="text-muted mb-2">
                Thank you for letting us know!
              </p>
              {anyAttending && (
                <p className="text-muted">
                  We can&apos;t wait to celebrate with you.
                </p>
              )}
            </div>

            <div className="pt-4 space-y-3">
              {members.map((guest) => {
                const r = rsvps[guest.id];
                const attending =
                  r?.welcomeParty ||
                  r?.ceremony ||
                  r?.reception ||
                  r?.goodbyeBrunch;
                return (
                  <div
                    key={guest.id}
                    className="border border-accent/20 p-4 text-left"
                  >
                    <p className="font-[var(--font-cinzel)] text-lg text-accent-light mb-2">
                      {guest.firstName}
                      {guest.lastName ? ` ${guest.lastName}` : ""}
                    </p>
                    <div className="text-sm text-muted space-y-1">
                      {attending ? (
                        <>
                          {r.welcomeParty && <p>Welcome Party - Attending</p>}
                          {r.ceremony && (
                            <p>
                              Ceremony &amp; Reception - Attending (
                              {r.mealChoice
                                ? r.mealChoice.charAt(0) +
                                  r.mealChoice.slice(1).toLowerCase()
                                : "No meal selected"}
                              )
                            </p>
                          )}
                          {r.goodbyeBrunch && (
                            <p>Goodbye Brunch - Attending</p>
                          )}
                        </>
                      ) : (
                        <p>Unable to attend</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setStep("search");
                setLastName("");
                setParties([]);
                setSelectedParty(null);
                setRsvps({});
                setCurrentMemberIndex(0);
              }}
              className="font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent/40 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-300"
            >
              RSVP for Another Guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventToggle({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-[var(--font-cinzel)] text-lg tracking-wider text-foreground">
          {label}
        </p>
        <p className="text-muted text-sm">{sublabel}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 text-sm tracking-wider uppercase border transition-all duration-200 ${
            checked
              ? "border-accent-light bg-accent-light text-background"
              : "border-accent/30 text-muted hover:border-accent-light hover:text-accent-light"
          }`}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 text-sm tracking-wider uppercase border transition-all duration-200 ${
            checked === false
              ? "border-accent-light bg-accent-light/10 text-accent-light"
              : "border-accent/30 text-muted hover:border-accent-light hover:text-accent-light"
          }`}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function MealOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 py-3 text-sm tracking-wider uppercase border transition-all duration-200 ${
        selected
          ? "border-accent-light bg-accent-light text-background"
          : "border-accent/30 text-muted hover:border-accent-light hover:text-accent-light"
      }`}
    >
      {label}
    </button>
  );
}
