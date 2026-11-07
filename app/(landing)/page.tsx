import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Logo, MapBackdrop, Star, staticMap } from "@/components/brand";

// Public landing page. Signed-out visitors only ever see the static sample rooms below, never real listings.

const BTN = "inline-flex min-h-[48px] items-center justify-center rounded-full px-6 font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-ink/25 active:scale-[0.98]";
const PRIMARY = `${BTN} bg-ink text-white shadow-[0_8px_24px_rgba(20,33,61,0.25)] hover:bg-ink/90`;
const GHOST = `${BTN} glass text-ink hover:bg-white`;
const EYEBROW = "text-[13px] font-bold uppercase tracking-[0.08em] text-ink/60";
const H2 = "mt-2 font-display text-[34px] font-bold leading-[1.1] tracking-tight md:text-[44px]";
const BADGE = "rounded-md px-2 py-0.5 text-[13px] font-semibold";
const HOUSE = {
  Brothers: "bg-white text-brothers ring-1 ring-brothers/25",
  Sisters: "bg-white text-sisters ring-1 ring-sisters/25",
  Mixed: "bg-white text-ink ring-1 ring-ink/20",
};

// Illustrative only: campus areas, not real listings.
const ROOMS = [
  { house: "Brothers", tag: "Halal kitchen", rent: "$950", beds: 3, baths: 2, mates: "2 roommates", area: "Near campus, Westwood (UCLA)", at: [-118.4452, 34.0689] },
  { house: "Sisters", tag: "Halal kitchen", rent: "$1,150", beds: 2, baths: 1, mates: "1 roommate", area: "Walkable to campus, Irvine (UCI)", at: [-117.8265, 33.6461] },
  { house: "Mixed", tag: "Pets OK", rent: "$1,350", beds: 4, baths: 2, mates: "3 roommates", area: "Near transit, San Diego (UCSD)", at: [-117.2340, 32.8801] },
] as const;

const STEPS = [
  ["Tell us what home means to you", "Pick your house type, budget, room type, and the details that matter, like a halal kitchen or pets."],
  ["Explore rooms on the map", "See real rooms near your campus, with your share of rent and estimated utilities up front."],
  ["Reach out to a verified student", "Every lister is confirmed through their school email, so you're talking to a real student, not a stranger."],
];

const FEATURES = [
  ["Verified students", "Listers confirm their .edu email, and you can see which campus they're at.", <path key="i" d="M5 12.5l4.5 4.5L19 7.5" />],
  ["Brothers, sisters, mixed", "Filter by the kind of house you're comfortable in.", <path key="i" d="M3 11l9-7 9 7M5 10v10h14V10" />],
  ["Halal kitchen filter", "Know before you visit whether the kitchen fits how you eat.", <path key="i" d="M7 3v8a3 3 0 006 0V3M10 3v18M17 3c-2 2-2 6 0 8v10" />],
  ["Honest pricing", "See your rent share plus average utilities, so there are no surprises.", <path key="i" d="M12 2v20M17 6H9.5a3 3 0 000 6h5a3 3 0 010 6H7" />],
] as const;

const FAQ = [
  ["Who can list a room?", "Students with a school email. Their campus is shown on every listing so you know who you're contacting."],
  ["Is Bayt Qareeb only for Muslim students?", "The platform is built around the needs of Muslim students, with house types and a halal-kitchen filter, and every student looking for a welcoming community is encouraged to explore it."],
  ["Who can sign up?", "Anyone with a verified college .edu email. Sign up with your school address and confirm the code we send you."],
  ["What does it cost to use?", "Nothing. Browsing rooms and contacting listers is free."],
  ["How do I contact a lister?", "Open any room on the map and tap \"Contact lister\" to send them an email directly."],
];

export default async function Landing() {
  const { userId } = await auth();
  const start = userId ? "/map" : "/sign-up";

  return (
    <div className="min-h-dvh bg-paper">
      {/* HERO: the map, standing still, with the app's glass UI floating over it */}
      <div className="relative isolate overflow-hidden pb-16 md:pb-24">
        <MapBackdrop />
        {/* Wash the map out behind the headline so the text reads first */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-paper/70 to-paper/0 lg:bg-gradient-to-r lg:from-paper/90 lg:via-paper/60 lg:to-paper/0" />

        <header className="mx-auto max-w-7xl px-3 pt-3 md:px-6 md:pt-5">
          <div className="glass flex h-16 items-center gap-4 rounded-2xl pl-3 pr-3 shadow-[0_10px_30px_rgba(20,33,61,0.14)]">
            <Logo />
            <nav aria-label="Main" className="mx-auto hidden gap-1 text-[15px] font-medium lg:flex">
              {[["#how", "How it works"], ["#rooms", "Rooms"], ["#why", "Why Bayt Qareeb"], ["#faq", "FAQ"]].map(([href, label]) => (
                <a key={href} href={href} className="rounded-full px-3.5 py-2 hover:bg-ink/5">{label}</a>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              {userId ? (
                <Link href="/map" className={`${PRIMARY} min-h-[44px] px-5`}>Open the map</Link>
              ) : (
                <>
                  <Link href="/sign-in" className="inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold hover:bg-ink/5">Sign in</Link>
                  <Link href="/sign-up" className={`${PRIMARY} hidden min-h-[44px] px-5 sm:inline-flex`}>Find a room</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section id="top" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="motion-safe:animate-fade-up">
            <p className="glass inline-block rounded-full px-3.5 py-1.5 text-[13px] font-semibold tracking-[0.04em]">FOR STUDENTS ON THE MOVE</p>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.02] tracking-tight sm:text-[56px] lg:text-[68px]">
              A new city should still feel like <span className="underline decoration-lantern decoration-[6px] underline-offset-[8px]">home.</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg text-ink/75 md:text-[19px]">
              Moving for school is hard enough. Bayt Qareeb connects students with verified roommates who share their values, routines and way of living, so the first night in a new place isn&apos;t a lonely one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={start} className={PRIMARY}>Browse rooms</Link>
              <a href="#how" className={GHOST}>See how it works</a>
            </div>
            {!userId && <p className="mt-4 text-sm text-ink/60">Free for students with a <b className="text-ink">.edu</b> email.</p>}
          </div>

          {/* A still of the map app: command bar, price pins and a room card */}
          <div aria-hidden="true" className="relative mx-auto h-[360px] w-full max-w-[520px] motion-safe:animate-fade-up sm:h-[420px]" style={{ animationDelay: "120ms" }}>
            <div className="glass absolute inset-x-0 top-0 flex h-14 items-center gap-2 rounded-2xl pl-2 pr-3 shadow-[0_10px_30px_rgba(20,33,61,0.18)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink"><Star className="h-5 w-5 text-white" /></span>
              <span className="truncate pl-1 text-[15px] text-ink/80">Sisters&apos; room near UCI with a halal kitchen</span>
              <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lantern">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
              </span>
            </div>
            <div className="mt-3 flex gap-2 pt-14">
              {["Sisters", "Under $1,200", "Halal kitchen"].map((p) => (
                <span key={p} className="glass rounded-full px-3.5 py-2 text-sm font-semibold">{p}</span>
              ))}
            </div>
            {[["$950", "left-[6%] top-[42%]"], ["$1.4K", "right-[8%] top-[34%]"], ["$1.1K", "left-[38%] top-[52%]", true]].map(([price, pos, active]) => (
              <span key={price as string} className={`absolute ${pos} rounded-full px-3 py-1.5 text-sm font-bold shadow-[0_4px_14px_rgba(20,33,61,0.25)] ${active ? "bg-lantern text-ink ring-2 ring-white" : "bg-ink text-white ring-2 ring-white"}`}>
                {price}
              </span>
            ))}
            <div className="glass absolute inset-x-0 bottom-0 flex overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(20,33,61,0.25)] sm:inset-x-6">
              <img src={staticMap("satellite-streets-v12", -117.8265, 33.6461, 15.5, 220, 220, true)} alt="" className="h-auto w-28 shrink-0 object-cover sm:w-32" />
              <div className="min-w-0 flex-1 p-3.5">
                <p className="text-xl font-bold leading-none">$1,150<span className="text-sm font-medium text-ink/60">/mo</span></p>
                <p className="mt-1.5 text-sm"><b>2</b> bd · <b>1</b> ba · Private room</p>
                <p className="mt-0.5 truncate text-sm text-ink/70">Walkable to campus, Irvine</p>
                <div className="mt-2 flex gap-1.5">
                  <span className={`${BADGE} ${HOUSE.Sisters}`}>Sisters</span>
                  <span className={`${BADGE} bg-sage/10 text-sage`}>Halal kitchen</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="mx-auto mt-14 max-w-7xl px-4 md:mt-20 md:px-8">
          <ul className="glass flex flex-wrap justify-between gap-x-10 gap-y-3 rounded-2xl px-6 py-5 text-[15px] font-semibold shadow-[0_10px_30px_rgba(20,33,61,0.1)]">
            {["Verified .edu listers", "Brothers, sisters and mixed houses", "Halal-kitchen filter", "Near UCLA, USC, UCR, UCSD, UCI, UC Davis and Stanford"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-lantern" />{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <main className="mx-auto max-w-7xl px-4 md:px-8">
        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-6 pt-16 md:pt-20">
          <p className={EYEBROW}>How it works</p>
          <h2 className={`${H2} max-w-[40rem]`}>Three steps from &ldquo;I need a place&rdquo; to &ldquo;I&apos;m home.&rdquo;</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="rounded-3xl bg-white p-7 shadow-[0_1px_3px_rgba(20,33,61,0.1)] ring-1 ring-ink/5 md:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-bold text-white">{i + 1}</span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-ink/70">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FEATURED ROOMS (static samples; real rooms with contact details are behind .edu sign-in) */}
        <section id="rooms" className="scroll-mt-6 pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={EYEBROW}>Featured rooms</p>
              <h2 className={H2}>Rooms that fit your life.</h2>
            </div>
            <Link href={start} className="font-semibold underline underline-offset-4 hover:text-ink/70">View all rooms on the map</Link>
          </div>
          <p className="mt-3 text-sm text-ink/60">Sample listings shown for illustration. Live rooms are on the map.</p>
          <ul className="mt-7 grid gap-5 md:grid-cols-3">
            {ROOMS.map((r) => (
              <li key={r.rent}>
                <Link href={start} className="group block overflow-hidden rounded-3xl bg-white shadow-[0_1px_3px_rgba(20,33,61,0.1)] ring-1 ring-ink/5 outline-none transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(20,33,61,0.16)] focus-visible:ring-4 focus-visible:ring-ink/25">
                  <div className="relative h-48">
                    <img src={staticMap("satellite-streets-v12", r.at[0], r.at[1], 15.3, 480, 260, true)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span className={`absolute left-3 top-3 ${BADGE} ${HOUSE[r.house]}`}>{r.house}</span>
                    <span className={`absolute bottom-3 left-3 ${BADGE} glass`}>{r.tag}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[26px] font-bold leading-none">{r.rent}<span className="text-[15px] font-medium text-ink/60">/mo</span></p>
                    <p className="mt-2.5 text-sm"><b>{r.beds}</b> bd · <b>{r.baths}</b> ba · Private room · {r.mates}</p>
                    <p className="mt-1 text-sm text-ink/65">{r.area}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* MISSION */}
        <section id="why" className="scroll-mt-6 pt-24">
          <div className="grid overflow-hidden rounded-[2rem] bg-ink text-white md:grid-cols-2">
            <div className="relative min-h-[260px] md:min-h-[440px]">
              <img src={staticMap("dark-v11", -118.2437, 34.0522, 10.2, 640, 640)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-ink" />
              {[["left-[30%] top-[38%]"], ["left-[55%] top-[55%]"], ["left-[44%] top-[28%]"], ["left-[66%] top-[36%]"]].map(([pos], i) => (
                <span key={pos} className={`absolute ${pos} grid h-5 w-5 place-items-center rounded-full ring-[3px] ring-white ${i === 0 ? "bg-lantern shadow-[0_0_24px_6px_rgba(233,185,73,0.55)]" : "bg-ink"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-ink" : "bg-white"}`} />
                </span>
              ))}
            </div>
            <div className="p-8 md:p-12 lg:p-14">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-lantern">Our mission</p>
              <h2 className="mt-2.5 font-display text-[32px] font-bold leading-[1.12] md:text-[40px]">No student should have to face a move alone.</h2>
              <p className="mt-5 text-[17px] text-white/80">
                Changing cities for school can mean unfamiliar streets, an unfamiliar kitchen, and nobody to share Ramadan iftar or a quiet Friday with. We built Bayt Qareeb, &ldquo;a home nearby,&rdquo; to make that first step gentler.
              </p>
              <p className="mt-3.5 text-[17px] text-white/80">
                We match students with housemates who share their values and daily rhythm, so a new address becomes a community from day one.
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {["Shared values", "Student-to-student", "Fair, upfront costs"].map((t) => (
                  <li key={t} className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-white/30">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="pt-24">
          <p className={EYEBROW}>Built for students</p>
          <h2 className={`${H2} max-w-[40rem]`}>Everything you need to feel settled.</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {FEATURES.map(([title, body, icon]) => (
              <li key={title} className="rounded-3xl bg-white p-7 shadow-[0_1px_3px_rgba(20,33,61,0.1)] ring-1 ring-ink/5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-lantern/25">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-[15px] text-ink/70">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-6 pt-24">
          <h2 className={`${H2} text-center`}>Questions, answered.</h2>
          <div className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-3xl bg-white shadow-[0_1px_3px_rgba(20,33,61,0.1)] ring-1 ring-ink/5">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[17px] font-semibold outline-none hover:bg-ink/[0.02] focus-visible:bg-ink/5 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-xl leading-none transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="px-6 pb-5 text-ink/70">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="join" className="scroll-mt-6 pt-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-lantern px-6 py-16 text-center md:py-20">
            <Star className="absolute -right-16 -top-16 h-64 w-64 text-white/20" />
            <Star className="absolute -bottom-20 -left-20 h-56 w-56 text-ink/[0.06]" />
            <h2 className="relative mx-auto max-w-[40rem] font-display text-[34px] font-bold leading-[1.1] md:text-[44px]">Your new home is closer than you think.</h2>
            <p className="relative mx-auto mt-4 max-w-[32rem] text-lg">Join students who are finding people who feel like family, wherever school takes them.</p>
            <Link href={start} className={`${PRIMARY} relative mt-8 px-8`}>{userId ? "Open the map" : "Find a room"}</Link>
            {!userId && <p className="relative mt-4 text-sm text-ink/70">Sign up with your college .edu email.</p>}
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-ink/10 px-4 pb-12 pt-8 text-sm text-ink/65 md:px-8">
        <span className="font-display text-lg font-bold text-ink">Bayt Qareeb</span>
        <span>Student housing, with community built in.</span>
        <span className="flex gap-5">
          <a href="#faq" className="hover:text-ink">FAQ</a>
          <Link href={userId ? "/map" : "/sign-in"} className="hover:text-ink">{userId ? "Map" : "Sign in"}</Link>
        </span>
      </footer>
    </div>
  );
}
