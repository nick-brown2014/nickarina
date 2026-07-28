"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

interface Stats {
  totalGuests: number;
  responded: number;
  attendingWelcome: number;
  attendingCeremony: number;
  attendingReception: number;
  attendingBrunch: number;
}

export default function RsvpStatusPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState("");

  const [lastName, setLastName] = useState("");
  const [parties, setParties] = useState<Party[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/rsvp/stats");
        const data = await res.json();
        if (!res.ok) {
          setStatsError(data.error || "Failed to load summary.");
          return;
        }
        setStats(data.stats);
      } catch {
        setStatsError("Failed to load summary.");
      }
    };
    fetchStats();
  }, []);

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
        setParties(null);
        return;
      }
      setParties(data.parties as Party[]);
    } catch {
      setSearchError("Something went wrong. Please try again.");
      setParties(null);
    } finally {
      setIsSearching(false);
    }
  };

  const responseRate =
    stats && stats.totalGuests > 0
      ? `${Math.round((stats.responded / stats.totalGuests) * 100)}%`
      : "0%";

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-special-elite)] text-4xl md:text-5xl tracking-wider text-foreground mb-4">
            RSVP Status
          </h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted text-lg">
            See how the celebration is coming together, or look up your own
            response.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-accent-light mb-6 text-center">
            The Guest List So Far
          </h2>

          {statsError && (
            <p className="text-red-400 text-sm text-center">{statsError}</p>
          )}

          {!stats && !statsError && (
            <p className="text-center text-muted py-4">Loading summary...</p>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Responded" value={stats.responded} />
              <StatCard label="Response Rate" value={responseRate} />
              <StatCard label="Welcome Party" value={stats.attendingWelcome} />
              <StatCard label="Ceremony" value={stats.attendingCeremony} />
              <StatCard label="Reception" value={stats.attendingReception} />
              <StatCard label="Goodbye Brunch" value={stats.attendingBrunch} />
            </div>
          )}
        </section>

        <section className="max-w-2xl mx-auto">
          <h2 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-accent-light mb-2 text-center">
            Check Your RSVP
          </h2>
          <p className="text-muted text-center mb-6">
            Enter your last name to see your party&apos;s current responses.
          </p>

          <form
            onSubmit={handleSearch}
            autoComplete="off"
            className="space-y-6 max-w-md mx-auto"
          >
            <div>
              <label
                htmlFor="lastName"
                className="block font-[var(--font-special-elite)] text-sm tracking-wider text-accent-light mb-2 uppercase"
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
              className="w-full font-[var(--font-special-elite)] cursor-pointer text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Look Up My RSVP"}
            </button>
          </form>

          {parties && (
            <div className="mt-10 space-y-6">
              {parties.map((party) => (
                <div
                  key={party.partyId}
                  className="border border-accent/20 p-6 md:p-8 space-y-6"
                >
                  {party.members.map((guest) => (
                    <GuestStatus key={guest.id} guest={guest} />
                  ))}
                </div>
              ))}

              <div className="text-center pt-2">
                <Link
                  href="/rsvp"
                  className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
                >
                  Submit or Change Responses
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="border border-accent/20 p-4 text-center">
      <p className="font-[var(--font-special-elite)] text-2xl text-accent-light mb-1">
        {value}
      </p>
      <p className="text-muted text-xs tracking-wider uppercase">{label}</p>
    </div>
  );
}

function GuestStatus({ guest }: { guest: Guest }) {
  const r = guest.rsvp;

  return (
    <div className="border-b border-accent/10 last:border-b-0 pb-6 last:pb-0">
      <h3 className="font-[var(--font-special-elite)] text-xl tracking-wider text-foreground mb-4">
        {guest.firstName}
        {guest.lastName ? ` ${guest.lastName}` : ""}
      </h3>

      {!r ? (
        <p className="text-muted text-sm">Not yet responded.</p>
      ) : (
        <div className="space-y-2">
          <EventStatus label="Welcome Party" value={r.welcomeParty} />
          <EventStatus label="Ceremony" value={r.ceremony} />
          <EventStatus label="Reception" value={r.reception} />
          <EventStatus label="Goodbye Brunch" value={r.goodbyeBrunch} />

          {(r.ceremony || r.reception) && (
            <div className="flex justify-between text-sm pt-1">
              <span className="text-muted">Meal</span>
              <span className="text-foreground">
                {r.mealChoice
                  ? r.mealChoice.charAt(0) + r.mealChoice.slice(1).toLowerCase()
                  : "Not selected"}
              </span>
            </div>
          )}

          {r.dietaryNotes && (
            <div className="flex justify-between text-sm gap-4">
              <span className="text-muted whitespace-nowrap">
                Dietary Notes
              </span>
              <span className="text-foreground text-right">
                {r.dietaryNotes}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventStatus({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span
        className={
          value === null
            ? "text-muted/60"
            : value
              ? "text-green-400"
              : "text-red-400"
        }
      >
        {value === null ? "Not yet responded" : value ? "Yes" : "No"}
      </span>
    </div>
  );
}
