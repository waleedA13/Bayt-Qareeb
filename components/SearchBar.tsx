"use client";

import { useState } from "react";
import type { SearchFilters } from "@/lib/searchFilters";

const LABEL: Record<string, (v: any) => string> = {
  maxRent: (v) => `≤ $${v}/mo`,
  genderPref: (v) => ({ BROTHERS: "Brothers only", SISTERS: "Sisters only", ANY: "Any" } as Record<string, string>)[v],
  roomType: (v) => (v === "PRIVATE" ? "Private room" : "Shared room"),
  petsAllowed: (v) => (v ? "Pets OK" : "No pets"),
  halalKitchen: (v) => (v ? "Halal kitchen" : "No halal kitchen"),
  nearText: (v) => `Near ${v}`,
};

export default function SearchBar({ onResults }: { onResults: (listings: any[], filters: SearchFilters) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setFilters(data.filters);
      onResults(data.listings, data.filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute left-4 top-4 z-10 w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-white/95 p-2 shadow-lg">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          placeholder="e.g. sisters-only private room near UCLA under $900"
          aria-label="Search listings"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {filters && (
        <div className="mt-2 flex flex-wrap gap-1" aria-live="polite">
          {Object.keys(filters).length === 0 && <span className="text-xs text-slate-500">No filters understood — showing all</span>}
          {Object.entries(filters).map(([k, v]) => (
            <span key={k} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
              {LABEL[k]?.(v) ?? `${k}: ${v}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
