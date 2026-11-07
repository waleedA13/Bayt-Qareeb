"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@prisma/client";

export type MyListing = Omit<Listing, "createdAt" | "ownerId" | "description"> & { description: string | null };

type Fields = {
  title: string; address: string; roomType: string; genderPref: string;
  totalRoommates: string; beds: string; baths: string;
  totalRent: string; rentShare: string; avgUtilities: string;
  petsAllowed: boolean; halalKitchen: boolean; description: string;
};

const EMPTY: Fields = {
  title: "", address: "", roomType: "", genderPref: "", totalRoommates: "", beds: "", baths: "",
  totalRent: "", rentShare: "", avgUtilities: "", petsAllowed: false, halalKitchen: true, description: "",
};
// Field order on the page, used to focus the first field with an error.
const ORDER: (keyof Fields)[] = ["title", "address", "roomType", "totalRoommates", "beds", "baths", "totalRent", "rentShare", "avgUtilities", "genderPref", "halalKitchen", "petsAllowed", "description"];

const toFields = (l: MyListing): Fields => ({
  ...l, description: l.description ?? "",
  totalRoommates: String(l.totalRoommates), beds: String(l.beds), baths: String(l.baths),
  totalRent: String(l.totalRent), rentShare: String(l.rentShare), avgUtilities: String(l.avgUtilities),
});

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const input =
  "mt-1.5 block min-h-[48px] w-full rounded-lg border bg-white px-3.5 text-[16px] outline-none transition placeholder:text-ink/45 focus:border-ink focus:ring-2 focus:ring-ink/15";
const border = (bad?: string) => (bad ? "border-clay" : "border-ink/20");

/** Post or edit form. Without `listing` it creates and goes to /listings/mine; with it, it PATCHes and calls onSaved. */
export default function ListingForm({ listing, onSaved, onCancel }: {
  listing?: MyListing; onSaved?: (l: MyListing) => void; onCancel?: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<Fields>(listing ? toFields(listing) : EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const id = listing?.id ?? "new";

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(listing ? `/api/listings/${listing.id}` : "/api/listings", {
        method: listing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fields: Record<string, string> = body.fields ?? {};
        setErrors(fields);
        setFormError(body.error ?? "Something went wrong. Please try again.");
        const first = ORDER.find((k) => fields[k]);
        if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      if (onSaved) onSaved(body);
      else router.push("/listings/mine");
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const text = (k: "title" | "address", label: string, max: number, placeholder: string, hint?: string) => (
    <div>
      <label htmlFor={`${id}-${k}`} className="font-semibold">{label}</label>
      {hint && <p id={`${id}-${k}-hint`} className="text-sm text-ink/60">{hint}</p>}
      <input
        id={`${id}-${k}`} name={k} value={f[k]} maxLength={max} placeholder={placeholder} required
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={!!errors[k]} aria-describedby={[hint && `${id}-${k}-hint`, errors[k] && `${id}-${k}-err`].filter(Boolean).join(" ") || undefined}
        className={`${input} ${border(errors[k])}`}
      />
      <FieldError id={`${id}-${k}-err`} msg={errors[k]} />
    </div>
  );

  const number = (k: keyof Fields, label: string, opts: { min: number; max: number; step?: number; prefix?: string }) => (
    <div>
      <label htmlFor={`${id}-${k}`} className="text-[15px] font-semibold">{label}</label>
      <div className="relative">
        {opts.prefix && <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-ink/50">{opts.prefix}</span>}
        <input
          id={`${id}-${k}`} name={k} type="number" inputMode={opts.step ? "decimal" : "numeric"} required
          min={opts.min} max={opts.max} step={opts.step ?? 1} value={f[k] as string}
          onChange={(e) => set(k, e.target.value)}
          aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${id}-${k}-err` : undefined}
          className={`${input} ${border(errors[k])} ${opts.prefix ? "pl-7" : ""}`}
        />
      </div>
      <FieldError id={`${id}-${k}-err`} msg={errors[k]} />
    </div>
  );

  const share = Number(f.rentShare) || 0;
  const monthly = share + (Number(f.avgUtilities) || 0);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="mt-2">
      <Section title="The place">
        {text("title", "Listing title", 80, "Private room near UCLA")}
        {text("address", "Street address", 200, "10920 Wilshire Blvd, Los Angeles",
          "Southern California only. We place the pin from this address, and we'll show you the address we matched.")}
      </Section>

      <Section title="The room">
        <Choice
          name="roomType" legend="Room" value={f.roomType} error={errors.roomType} id={id}
          onChange={(v) => set("roomType", v)}
          options={[{ value: "PRIVATE", label: "Private room" }, { value: "SHARED", label: "Shared room" }]}
        />
        <div className="grid grid-cols-3 gap-3">
          {number("totalRoommates", "Roommates", { min: 1, max: 20 })}
          {number("beds", "Bedrooms", { min: 0, max: 20 })}
          {number("baths", "Bathrooms", { min: 0.5, max: 10, step: 0.5 })}
        </div>
        <p className="-mt-2 text-sm text-ink/60">Roommates counts everyone in the place, including the new person.</p>
      </Section>

      <Section title="Monthly cost">
        <div className="grid grid-cols-2 gap-3">
          {number("rentShare", "Rent for this room", { min: 0, max: 10000, prefix: "$" })}
          {number("totalRent", "Whole apartment", { min: 0, max: 10000, prefix: "$" })}
        </div>
        {number("avgUtilities", "Utilities per person (avg.)", { min: 0, max: 10000, prefix: "$" })}
      </Section>

      <Section title="House rules">
        <Choice
          name="genderPref" legend="Who can live here" value={f.genderPref} error={errors.genderPref} id={id}
          onChange={(v) => set("genderPref", v)}
          options={[
            { value: "BROTHERS", label: "Brothers", on: "border-brothers bg-brothers text-white" },
            { value: "SISTERS", label: "Sisters", on: "border-sisters bg-sisters text-white" },
            { value: "ANY", label: "Mixed" },
          ]}
        />
        <Toggle name="halalKitchen" label="Halal kitchen" hint="Only halal food is cooked here." checked={f.halalKitchen} onChange={(v) => set("halalKitchen", v)} error={errors.halalKitchen} />
        <Toggle name="petsAllowed" label="Pets welcome" checked={f.petsAllowed} onChange={(v) => set("petsAllowed", v)} error={errors.petsAllowed} />
      </Section>

      <Section title="What's special">
        <div>
          <label htmlFor={`${id}-description`} className="font-semibold">Description <span className="font-normal text-ink/60">(optional)</span></label>
          <textarea
            id={`${id}-description`} name="description" rows={5} maxLength={1000} value={f.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Walk to campus, quiet house, masjid nearby…"
            aria-invalid={!!errors.description} aria-describedby={`${id}-description-count${errors.description ? ` ${id}-description-err` : ""}`}
            className={`${input} ${border(errors.description)} py-3 leading-relaxed`}
          />
          <p id={`${id}-description-count`} className="mt-1 text-right text-sm text-ink/60">{f.description.length} / 1000</p>
          <FieldError id={`${id}-description-err`} msg={errors.description} />
        </div>
      </Section>

      <div className="sticky bottom-0 mt-6 rounded-t-xl border border-b-0 border-ink/10 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(20,33,61,0.08)] sm:bottom-3 sm:rounded-xl sm:border-b">
        <p role="alert" className={formError ? "mb-3 rounded-lg bg-clay/10 px-3 py-2 text-[15px] font-medium text-clay" : "sr-only"}>{formError}</p>
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-lg font-bold leading-none">{usd(monthly)}</p>
            <p className="text-xs text-ink/60">est. / month</p>
          </div>
          {onCancel && (
            <button type="button" onClick={onCancel} className="ml-auto min-h-[48px] whitespace-nowrap rounded-lg px-3 font-semibold hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
              Cancel
            </button>
          )}
          <button
            type="submit" disabled={saving}
            className={`${onCancel ? "" : "flex-1"} min-h-[48px] whitespace-nowrap rounded-lg bg-lantern px-5 font-bold text-ink transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60`}
          >
            {saving ? (listing ? "Saving…" : "Posting…") : listing ? "Save changes" : "Post room"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-4 rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} className="mt-1.5 text-sm font-medium text-clay">{msg}</p> : null;
}

function Choice({ name, legend, value, options, onChange, error, id }: {
  name: string; legend: string; value: string; error?: string; id: string;
  options: { value: string; label: string; on?: string }[]; onChange: (v: string) => void;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-${name}-err` : undefined}>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-1.5 flex gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[48px] flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 text-center font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ink/30 ${
                on ? o.on ?? "border-ink bg-ink text-white" : error ? "border-clay bg-white" : "border-ink/20 bg-white hover:border-ink/50"
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-${name}-err`} msg={error} />
    </fieldset>
  );
}

function Toggle({ name, label, hint, checked, onChange, error }: {
  name: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; error?: string;
}) {
  return (
    <div>
      <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ink/30">
        <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-ink/20 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-sage peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none" />
        <span>
          <span className="block font-semibold">{label}</span>
          {hint && <span className="block text-sm text-ink/60">{hint}</span>}
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm font-medium text-clay">{error}</p>}
    </div>
  );
}
