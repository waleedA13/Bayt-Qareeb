"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "../Shell";
import ListingForm, { type MyListing } from "../ListingForm";

const MAX = 5;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const HOUSE: Record<string, string> = { BROTHERS: "Brothers", SISTERS: "Sisters", ANY: "Mixed" };
const btn = "min-h-[44px] rounded-lg px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink";

export default function MyListings({ initial, email }: { initial: MyListing[]; email: string }) {
  const [listings, setListings] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      // 404 means it's already gone, so drop it from the list either way.
      if (res.ok || res.status === 404) {
        setListings((ls) => ls.filter((l) => l.id !== id));
        setConfirming(null);
      } else {
        setError({ id, msg: (await res.json().catch(() => ({}))).error ?? "Couldn't delete it. Please try again." });
      }
    } catch {
      setError({ id, msg: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  const post = listings.length < MAX && (
    <Link href="/listings/new" className={`${btn} grid place-items-center bg-lantern font-bold text-ink hover:brightness-105`}>
      Post a room
    </Link>
  );

  return (
    <Shell title="My listings" action={listings.length > 0 ? post : undefined}>
      <p className="mt-2 text-ink/70">
        Renters contact you at <b className="font-semibold text-ink">{email}</b>. You can have up to {MAX} listings.
      </p>

      {listings.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-ink/25 bg-white p-8 text-center">
          <p className="font-semibold">You haven't posted a room yet.</p>
          <p className="mt-1 text-ink/70">Have a spare room or need a roommate? Post it for verified students to find.</p>
          <div className="mt-5 flex justify-center">{post}</div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {listings.map((l) =>
          editing === l.id ? (
            <li key={l.id} className="rounded-xl border-2 border-ink/80 bg-paper px-3 pb-1 pt-3">
              <h2 className="font-display text-xl font-bold">Edit listing</h2>
              <ListingForm
                listing={l}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setListings((ls) => ls.map((x) => (x.id === saved.id ? saved : x)));
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <li key={l.id} className="rounded-xl border border-ink/10 bg-white p-4">
              <p className="text-xl font-bold">
                {usd(l.rentShare)}<span className="text-base font-medium text-ink/60">/mo</span>{" "}
                <span className="text-sm font-medium text-ink/60">of {usd(l.totalRent)}</span>
              </p>
              <h2 className="mt-1 font-semibold leading-snug">{l.title}</h2>
              <p className="text-[15px] text-ink/65">{l.address}</p>
              <p className="mt-2 text-sm text-ink/80">
                {l.roomType === "PRIVATE" ? "Private" : "Shared"} room <span className="text-ink/30">|</span> {HOUSE[l.genderPref]}{" "}
                <span className="text-ink/30">|</span> {l.beds} bd, {l.baths} ba <span className="text-ink/30">|</span> {l.totalRoommates} roommates
              </p>

              {confirming === l.id ? (
                <div role="group" aria-label="Confirm delete" className="mt-4 rounded-lg bg-clay/10 p-3">
                  <p className="font-semibold text-clay">Delete this listing? This can't be undone.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button disabled={busy} onClick={() => remove(l.id)} className={`${btn} bg-clay text-white hover:bg-clay/90 disabled:opacity-60`}>
                      {busy ? "Deleting…" : "Delete listing"}
                    </button>
                    <button onClick={() => setConfirming(null)} className={`${btn} bg-white hover:bg-paper`}>Keep it</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setEditing(l.id); setConfirming(null); }} className={`${btn} border border-ink/20 hover:border-ink/50`}>Edit</button>
                  <button onClick={() => { setConfirming(l.id); setError(null); }} className={`${btn} text-clay hover:bg-clay/10`}>Delete</button>
                </div>
              )}
              {error?.id === l.id && <p role="alert" className="mt-2 text-sm font-medium text-clay">{error.msg}</p>}
            </li>
          )
        )}
      </ul>
    </Shell>
  );
}
