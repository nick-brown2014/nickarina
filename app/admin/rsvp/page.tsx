"use client";

import { useState, useCallback } from "react";

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
    submittedAt: string;
  } | null;
}

interface Stats {
  totalGuests: number;
  responded: number;
  notResponded: number;
  attendingWelcome: number;
  attendingCeremony: number;
  attendingReception: number;
  attendingBrunch: number;
  meatCount: number;
  vegetarianCount: number;
}

type FilterType = "all" | "responded" | "not-responded" | "attending" | "declined";

export default function AdminRsvpPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const fetchData = useCallback(async (secret: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp/admin", {
        headers: { Authorization: `Bearer ${secret}` },
      });

      if (res.status === 401) {
        setAuthError("Invalid admin secret.");
        setAuthenticated(false);
        return;
      }

      const data = await res.json();
      setGuests(data.guests);
      setStats(data.stats);
      setAuthenticated(true);
    } catch {
      setAuthError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    fetchData(adminSecret);
  };

  const filteredGuests = guests.filter((g) => {
    switch (filter) {
      case "responded":
        return g.rsvp !== null;
      case "not-responded":
        return g.rsvp === null;
      case "attending":
        return g.rsvp?.welcomeParty || g.rsvp?.ceremony || g.rsvp?.reception || g.rsvp?.goodbyeBrunch;
      case "declined":
        return g.rsvp !== null && !g.rsvp.welcomeParty && !g.rsvp.ceremony && !g.rsvp.reception && !g.rsvp.goodbyeBrunch;
      default:
        return true;
    }
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-6 flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-[var(--font-cinzel)] text-3xl tracking-wider text-foreground mb-4">
              Admin Access
            </h1>
            <div className="w-16 h-px bg-accent mx-auto mb-6" />
          </div>
          <div>
            <label
              htmlFor="adminSecret"
              className="block font-[var(--font-cinzel)] text-sm tracking-wider text-accent-light mb-2 uppercase"
            >
              Admin Secret
            </label>
            <input
              id="adminSecret"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full bg-transparent border border-accent/30 px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors"
              placeholder="Enter admin secret"
              required
            />
          </div>
          {authError && (
            <p className="text-red-400 text-sm text-center">{authError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-6 flex items-center justify-center">
        <p className="text-muted text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-cinzel)] text-4xl tracking-wider text-foreground mb-4">
            RSVP Dashboard
          </h1>
          <div className="w-16 h-px bg-accent mx-auto" />
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatCard label="Total Guests" value={stats.totalGuests} />
            <StatCard label="Responded" value={stats.responded} />
            <StatCard label="Awaiting" value={stats.notResponded} />
            <StatCard
              label="Response Rate"
              value={
                stats.totalGuests > 0
                  ? `${Math.round((stats.responded / stats.totalGuests) * 100)}%`
                  : "0%"
              }
            />
            <StatCard label="Welcome Party" value={stats.attendingWelcome} />
            <StatCard label="Ceremony" value={stats.attendingCeremony} />
            <StatCard label="Reception" value={stats.attendingReception} />
            <StatCard label="Goodbye Brunch" value={stats.attendingBrunch} />
            <StatCard label="Meat" value={stats.meatCount} />
            <StatCard label="Vegetarian" value={stats.vegetarianCount} />
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "responded", "not-responded", "attending", "declined"] as FilterType[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs tracking-wider uppercase border transition-all duration-200 ${
                  filter === f
                    ? "border-accent-light text-accent-light"
                    : "border-accent/30 text-muted hover:border-accent-light"
                }`}
              >
                {f.replace("-", " ")}
              </button>
            )
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-accent/30">
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Name
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Party
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Welcome
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Ceremony
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Reception
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Brunch
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Meal
                </th>
                <th className="py-3 px-4 font-[var(--font-cinzel)] text-xs tracking-wider text-accent-light uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className="border-b border-accent/10 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-3 px-4 text-foreground">
                    {guest.firstName} {guest.lastName}
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {guest.partyId}
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.welcomeParty ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.ceremony ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.reception ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.goodbyeBrunch ?? null} />
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {guest.rsvp?.mealChoice
                      ? guest.rsvp.mealChoice.charAt(0) + guest.rsvp.mealChoice.slice(1).toLowerCase()
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-muted text-sm max-w-[200px] truncate">
                    {guest.rsvp?.dietaryNotes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGuests.length === 0 && (
            <p className="text-center text-muted py-8">
              No guests match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-accent/20 p-4 text-center">
      <p className="font-[var(--font-cinzel)] text-2xl text-accent-light mb-1">
        {value}
      </p>
      <p className="text-muted text-xs tracking-wider uppercase">{label}</p>
    </div>
  );
}

function RsvpBadge({ value }: { value: boolean | null }) {
  if (value === null) {
    return <span className="text-muted/50 text-sm">-</span>;
  }
  return (
    <span
      className={`text-xs tracking-wider uppercase ${
        value ? "text-green-400" : "text-red-400"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}
