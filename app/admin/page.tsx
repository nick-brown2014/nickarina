"use client";

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  partyId: string;
  rsvp: {
    welcomeParty: boolean | null;
    welcomePartyShuttle: boolean | null;
    ceremony: boolean | null;
    ceremonyShuttle: boolean | null;
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
  welcomeShuttleCount: number;
  ceremonyShuttleCount: number;
  meatCount: number;
  vegetarianCount: number;
}

type FilterType =
  | "all"
  | "responded"
  | "not-responded"
  | "attending"
  | "declined";

export default function AdminPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [modalGuest, setModalGuest] = useState<Guest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

      if (!res.ok) {
        setAuthError(data.error || "Failed to load data.");
        return;
      }

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
        return (
          g.rsvp?.welcomeParty ||
          g.rsvp?.ceremony ||
          g.rsvp?.reception ||
          g.rsvp?.goodbyeBrunch
        );
      case "declined":
        return (
          g.rsvp !== null &&
          !g.rsvp.welcomeParty &&
          !g.rsvp.ceremony &&
          !g.rsvp.reception &&
          !g.rsvp.goodbyeBrunch
        );
      default:
        return true;
    }
  });

  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Party ID",
      "Welcome Party",
      "Welcome Shuttle",
      "Ceremony",
      "Ceremony Shuttle",
      "Reception",
      "Goodbye Brunch",
      "Meal Choice",
      "Dietary Notes",
      "Submitted At",
    ];

    const rows = filteredGuests.map((g) => [
      g.firstName,
      g.lastName,
      g.partyId,
      g.rsvp?.welcomeParty === true
        ? "Yes"
        : g.rsvp?.welcomeParty === false
          ? "No"
          : "Pending",
      g.rsvp?.welcomePartyShuttle === true
        ? "Yes"
        : g.rsvp?.welcomePartyShuttle === false
          ? "No"
          : "N/A",
      g.rsvp?.ceremony === true
        ? "Yes"
        : g.rsvp?.ceremony === false
          ? "No"
          : "Pending",
      g.rsvp?.ceremonyShuttle === true
        ? "Yes"
        : g.rsvp?.ceremonyShuttle === false
          ? "No"
          : "N/A",
      g.rsvp?.reception === true
        ? "Yes"
        : g.rsvp?.reception === false
          ? "No"
          : "Pending",
      g.rsvp?.goodbyeBrunch === true
        ? "Yes"
        : g.rsvp?.goodbyeBrunch === false
          ? "No"
          : "Pending",
      g.rsvp?.mealChoice || "N/A",
      g.rsvp?.dietaryNotes || "",
      g.rsvp?.submittedAt
        ? new Date(g.rsvp.submittedAt).toLocaleDateString()
        : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvp-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-6 flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-[var(--font-special-elite)] text-3xl tracking-wider text-foreground mb-4">
              Admin Access
            </h1>
            <div className="w-16 h-px bg-accent mx-auto mb-6" />
          </div>
          <div>
            <label
              htmlFor="adminSecret"
              className="block font-[var(--font-special-elite)] text-sm tracking-wider text-accent-light mb-2 uppercase"
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
            className="w-full font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-8 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h1 className="font-[var(--font-special-elite)] text-4xl tracking-wider text-foreground mb-4">
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
            <StatCard
              label="Welcome Shuttle"
              value={stats.welcomeShuttleCount}
            />
            <StatCard
              label="Ceremony Shuttle"
              value={stats.ceremonyShuttleCount}
            />
            <StatCard label="Meat" value={stats.meatCount} />
            <StatCard label="Vegetarian" value={stats.vegetarianCount} />
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {(
              [
                "all",
                "responded",
                "not-responded",
                "attending",
                "declined",
              ] as FilterType[]
            ).map((f) => (
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
            ))}
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-xs tracking-wider uppercase border border-accent/30 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => {
              setModalGuest(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-xs tracking-wider uppercase border border-accent/30 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-200"
          >
            + Add Guest
          </button>
        </div>

        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Name
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Party
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Welcome
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  W. Shuttle
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Ceremony
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  C. Shuttle
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Reception
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Brunch
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
                  Meal
                </th>
                <th className="sticky top-0 z-10 bg-background py-3 px-4 font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light uppercase shadow-[0_1px_0_0] shadow-accent/30">
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
                    <button
                      onClick={() => {
                        setModalGuest(guest);
                        setModalOpen(true);
                      }}
                      className="text-left hover:text-accent-light underline decoration-accent/30 underline-offset-4 hover:decoration-accent-light transition-colors cursor-pointer"
                    >
                      {guest.firstName}
                      {guest.lastName ? ` ${guest.lastName}` : ""}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {guest.partyId}
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.welcomeParty ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.welcomePartyShuttle ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.ceremony ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.ceremonyShuttle ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.reception ?? null} />
                  </td>
                  <td className="py-3 px-4">
                    <RsvpBadge value={guest.rsvp?.goodbyeBrunch ?? null} />
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {guest.rsvp?.mealChoice
                      ? guest.rsvp.mealChoice.charAt(0) +
                        guest.rsvp.mealChoice.slice(1).toLowerCase()
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    <NotesCell notes={guest.rsvp?.dietaryNotes ?? null} />
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

      {modalOpen && (
        <GuestModal
          guest={modalGuest}
          adminSecret={adminSecret}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchData(adminSecret);
          }}
        />
      )}
    </div>
  );
}

function GuestModal({
  guest,
  adminSecret,
  onClose,
  onSaved,
}: {
  guest: Guest | null;
  adminSecret: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = guest === null;
  const [firstName, setFirstName] = useState(guest?.firstName ?? "");
  const [lastName, setLastName] = useState(guest?.lastName ?? "");
  const [partyId, setPartyId] = useState(guest?.partyId ?? "");
  const [rsvpFields, setRsvpFields] = useState({
    welcomeParty: guest?.rsvp?.welcomeParty ?? null,
    welcomePartyShuttle: guest?.rsvp?.welcomePartyShuttle ?? null,
    ceremony: guest?.rsvp?.ceremony ?? null,
    ceremonyShuttle: guest?.rsvp?.ceremonyShuttle ?? null,
    reception: guest?.rsvp?.reception ?? null,
    goodbyeBrunch: guest?.rsvp?.goodbyeBrunch ?? null,
  });
  const [mealChoice, setMealChoice] = useState<"MEAT" | "VEGETARIAN" | "">(
    guest?.rsvp?.mealChoice ?? ""
  );
  const [dietaryNotes, setDietaryNotes] = useState(
    guest?.rsvp?.dietaryNotes ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rsvpLabels: { key: keyof typeof rsvpFields; label: string }[] = [
    { key: "welcomeParty", label: "Welcome Party" },
    { key: "welcomePartyShuttle", label: "Welcome Shuttle" },
    { key: "ceremony", label: "Ceremony" },
    { key: "ceremonyShuttle", label: "Ceremony Shuttle" },
    { key: "reception", label: "Reception" },
    { key: "goodbyeBrunch", label: "Goodbye Brunch" },
  ];

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSecret}`,
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !partyId.trim()) {
      setError("First name, last name, and party are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let guestId = guest?.id;
      if (isNew) {
        const res = await fetch("/api/rsvp/admin", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ firstName, lastName, partyId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create guest.");
          return;
        }
        guestId = data.guest.id;
      }

      const hasRsvpValues =
        Object.values(rsvpFields).some((v) => v !== null) ||
        mealChoice !== "" ||
        dietaryNotes.trim() !== "";

      const res = await fetch("/api/rsvp/admin", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          id: guestId,
          firstName,
          lastName,
          partyId,
          rsvp:
            guest?.rsvp || hasRsvpValues
              ? {
                  ...rsvpFields,
                  mealChoice: mealChoice || null,
                  dietaryNotes: dietaryNotes.trim() || null,
                }
              : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save guest.");
        return;
      }
      onSaved();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guest) return;
    if (
      !window.confirm(
        `Remove ${guest.firstName} ${guest.lastName} from the guest list? This also deletes their RSVP.`
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rsvp/admin", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ id: guest.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete guest.");
        return;
      }
      onSaved();
    } catch {
      setError("Failed to delete. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border border-accent/30 px-3 py-2 text-foreground text-sm placeholder:text-muted/50 focus:border-accent-light focus:outline-none transition-colors";
  const labelClass =
    "block font-[var(--font-special-elite)] text-xs tracking-wider text-accent-light mb-1 uppercase";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto border border-accent/40 bg-background p-6 shadow-lg shadow-black/50"
      >
        <h2 className="font-[var(--font-special-elite)] text-xl tracking-wider text-foreground mb-6">
          {isNew ? "Add Guest" : "Edit Guest"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className={labelClass}>Party</label>
          <input
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className={inputClass}
            placeholder="e.g. party-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {rsvpLabels.map(({ key, label }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <select
                value={
                  rsvpFields[key] === null
                    ? ""
                    : rsvpFields[key]
                      ? "yes"
                      : "no"
                }
                onChange={(e) =>
                  setRsvpFields((prev) => ({
                    ...prev,
                    [key]:
                      e.target.value === ""
                        ? null
                        : e.target.value === "yes",
                  }))
                }
                className={inputClass}
              >
                <option value="">Pending</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className={labelClass}>Meal Choice</label>
          <select
            value={mealChoice}
            onChange={(e) =>
              setMealChoice(e.target.value as "MEAT" | "VEGETARIAN" | "")
            }
            className={inputClass}
          >
            <option value="">None</option>
            <option value="MEAT">Meat</option>
            <option value="VEGETARIAN">Vegetarian</option>
          </select>
        </div>

        <div className="mb-6">
          <label className={labelClass}>Dietary Notes</label>
          <textarea
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-xs tracking-[0.2em] uppercase border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-xs tracking-[0.2em] uppercase border border-accent/30 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="ml-auto px-6 py-2 text-xs tracking-[0.2em] uppercase border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
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

function NotesCell({ notes }: { notes: string | null }) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    above: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 320;
    const gap = 8;
    const estimatedHeight = 160;
    const above = rect.bottom + gap + estimatedHeight > window.innerHeight;
    setPosition({
      top: above ? rect.top - gap : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.left, window.innerWidth - width - gap)),
      above,
    });
  };

  const hide = () => setPosition(null);

  if (!notes) {
    return <span className="text-muted/50 text-sm">-</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="block max-w-[200px] truncate cursor-help focus:outline-none focus:text-accent-light"
      >
        {notes}
      </span>
      {position &&
        createPortal(
          <div
            role="tooltip"
            style={{
              top: position.top,
              left: position.left,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
            className="fixed z-50 w-80 max-h-64 overflow-y-auto border border-accent/40 bg-background px-4 py-3 text-sm text-foreground whitespace-pre-wrap break-words shadow-lg shadow-black/50"
          >
            {notes}
          </div>,
          document.body
        )}
    </>
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
