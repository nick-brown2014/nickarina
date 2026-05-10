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

type Step = "search" | "rsvp" | "confirmation";

export default function RsvpPage() {
  const [step, setStep] = useState<Step>("search");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, GuestRsvp>>({});
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
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error);
        return;
      }

      setGuests(data.guests);

      const initialRsvps: Record<string, GuestRsvp> = {};
      for (const guest of data.guests as Guest[]) {
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
      setStep("rsvp");
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const updateRsvp = (guestId: string, field: keyof GuestRsvp, value: boolean | string | null) => {
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

  const anyAttending = Object.values(rsvps).some(
    (r) => r.welcomeParty || r.ceremony || r.reception || r.goodbyeBrunch
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-cinzel)] text-4xl md:text-5xl tracking-wider text-foreground mb-4">
            RSVP
          </h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted text-lg">
            {step === "search" && "Please enter your name to find your invitation."}
            {step === "rsvp" && "Please respond for each guest in your party."}
            {step === "confirmation" && "Thank you for your response!"}
          </p>
        </div>

        {step === "search" && (
          <form onSubmit={handleSearch} autoComplete="off" className="space-y-6 max-w-md mx-auto">
            <div>
              <label
                htmlFor="firstName"
                className="block font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-2 uppercase"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="off"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-transparent border border-accent/30 px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors"
                placeholder="Enter your first name"
                required
              />
            </div>
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
              className="w-full font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Find My Invitation"}
            </button>
          </form>
        )}

        {step === "rsvp" && (
          <div className="space-y-10">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="border border-accent/20 p-6 md:p-8"
              >
                <h2 className="font-[var(--font-cinzel)] text-2xl tracking-wider text-accent-light mb-6">
                  {guest.firstName} {guest.lastName}
                </h2>

                <div className="space-y-6">
                  <EventToggle
                    label="Welcome Party"
                    sublabel="October 30, 2026"
                    checked={rsvps[guest.id]?.welcomeParty}
                    onChange={(v) => updateRsvp(guest.id, "welcomeParty", v)}
                  />
                  <EventToggle
                    label="Ceremony & Reception"
                    sublabel="October 31, 2026"
                    checked={rsvps[guest.id]?.ceremony}
                    onChange={(v) => {
                      updateRsvp(guest.id, "ceremony", v);
                      updateRsvp(guest.id, "reception", v);
                      if (!v) updateRsvp(guest.id, "mealChoice", null);
                    }}
                  />
                  <EventToggle
                    label="Goodbye Brunch"
                    sublabel="November 1, 2026"
                    checked={rsvps[guest.id]?.goodbyeBrunch}
                    onChange={(v) => updateRsvp(guest.id, "goodbyeBrunch", v)}
                  />

                  {(rsvps[guest.id]?.ceremony || rsvps[guest.id]?.reception) && (
                    <div className="pt-4 border-t border-accent/10">
                      <p className="font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-4 uppercase">
                        Meal Selection
                      </p>
                      <div className="flex gap-4">
                        <MealOption
                          label="Meat"
                          selected={rsvps[guest.id]?.mealChoice === "MEAT"}
                          onSelect={() => updateRsvp(guest.id, "mealChoice", "MEAT")}
                        />
                        <MealOption
                          label="Vegetarian"
                          selected={rsvps[guest.id]?.mealChoice === "VEGETARIAN"}
                          onSelect={() => updateRsvp(guest.id, "mealChoice", "VEGETARIAN")}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-accent/10">
                    <label
                      htmlFor={`dietary-${guest.id}`}
                      className="block font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-2 uppercase"
                    >
                      Dietary Restrictions or Notes
                    </label>
                    <textarea
                      id={`dietary-${guest.id}`}
                      value={rsvps[guest.id]?.dietaryNotes ?? ""}
                      onChange={(e) => updateRsvp(guest.id, "dietaryNotes", e.target.value)}
                      className="w-full bg-transparent border border-accent/30 px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors resize-none"
                      rows={2}
                      placeholder="Any allergies or dietary requirements..."
                    />
                  </div>
                </div>
              </div>
            ))}

            {submitError && (
              <p className="text-red-400 text-sm text-center">{submitError}</p>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep("search")}
                className="flex-1 font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent/40 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit RSVP"}
              </button>
            </div>
          </div>
        )}

        {step === "confirmation" && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 mx-auto border border-accent-light rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
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
              {guests.map((guest) => {
                const r = rsvps[guest.id];
                const attending = r?.welcomeParty || r?.ceremony || r?.reception || r?.goodbyeBrunch;
                return (
                  <div key={guest.id} className="border border-accent/20 p-4 text-left">
                    <p className="font-[var(--font-cinzel)] text-lg text-accent-light mb-2">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <div className="text-sm text-muted space-y-1">
                      {attending ? (
                        <>
                          {r.welcomeParty && <p>Welcome Party - Attending</p>}
                          {r.ceremony && <p>Ceremony & Reception - Attending ({r.mealChoice ? r.mealChoice.charAt(0) + r.mealChoice.slice(1).toLowerCase() : "No meal selected"})</p>}
                          {r.goodbyeBrunch && <p>Goodbye Brunch - Attending</p>}
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
                setFirstName("");
                setLastName("");
                setGuests([]);
                setRsvps({});
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
