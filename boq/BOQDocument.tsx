// Ledlum — Bill of Quantities (multi-page quotation document)
//
// Layout follows LEDLUM's issued-quotation format: dark cover page, commercial
// summary by supply group, itemised schedule (grouped bands, group subtotals,
// carried/brought forward), terms & conditions with signature strips — in the
// app's own palette (charcoal + gold) and fonts (Bai Jamjuree + Poppins).
//
// Rendered off-screen and captured page-by-page (<section>) into a PDF by
// lib/exportBoqPdf.tsx — every <section> is exactly one fixed-size page.

import type { ReactNode } from "react";

// ── Types ───────────────────────────────────────────────────────────────

export type BoqRow = {
  slNo: number;
  image?: string;
  /** DB column -> display value (see lib/productColumns.ts). */
  attributes: Record<string, string>;
  /** extra_specs key -> value. */
  specs: Record<string, string>;
  qty: number;
  unit: string;
  mrp: number; // D.P. per unit (list)
  disc: number; // percent
  net: number; // net rate per unit
  total: number; // line amount
  /** Supply group (defaults to the product type). */
  group?: string;
  /** Display name (defaults to product type / "Product Name" spec). */
  name?: string;
  /** Product code (defaults to the model). */
  code?: string;
};

export type BoqTotals = {
  basic: number;
  gstRate: number;
  gst: number;
  grand: number;
  words: string;
};

export type BoqMeta = {
  date: string;
  revisionNo: string;
  project: string;
  projectCode: string;
  location: string;
  preparedBy: string;
  projectName: string;
  architectName: string;
  architectPan: string;
  dealerName: string;
  companyAddress: string;
  /** Logo for the dark cover (white wordmark) — see exportBoqPdf. */
  logo?: string;
  /** Logo for white pages (dark wordmark). */
  logoLight?: string;
};

// ── Brand ───────────────────────────────────────────────────────────────

const C = {
  ink: "#171717",
  charcoal: "#12100f",
  charcoal2: "#2a2520",
  gold: "#9a8c66",
  goldDark: "#7a6e4e",
  goldBright: "#b08d57",
  cream: "#ece3d4",
  paper: "#f7f4ee",
  line: "#e6e0d4",
  muted: "#8a8478",
  text: "#4a4640",
};

const HEAD = "font-bai"; // Bai Jamjuree — headings & figures
const BODY = "font-pop"; // Poppins — body text
const NUM = `${HEAD} tabular-nums`;

/** Page size in CSS px (A4 landscape ratio). */
export const PAGE_W = 1308;
export const PAGE_H = 925;

export const COMPANY_NAME = "LEDLUM · All Home Bharat Platform Private Limited";
export const LEDLUM_ADDRESS = "No. 22A, 1st Floor, 7th Street, Sector 3, Ambattur, Chennai - 600098";

export const TERMS: { title: string; body: string }[] = [
  { title: "Validity", body: "This quotation is valid for a period of 15 days from the date of issuance. Prices and availability are subject to revision thereafter." },
  { title: "Delivery", body: "Delivery for all items shall be within 4–5 weeks from the date of receipt of a confirmed purchase order along with advance payment. Delivery timelines are indicative and subject to order size and production schedules." },
  { title: "Payment", body: "100% advance payment is required against a confirmed purchase order. Dispatch of materials will be initiated only upon receipt of full payment." },
  { title: "Freight & handling", body: "Packing, forwarding, freight, and insurance charges are not included in this quotation and will be charged additionally, as applicable." },
  { title: "Warranty", body: "All products are covered under a standard warranty period of 2 years against manufacturing defects, unless specified otherwise." },
  { title: "Replacements", body: "Goods once sold will not be taken back or exchanged. Replacements will be considered only in cases of proven manufacturing defects, subject to inspection and approval." },
  { title: "Taxes", body: "Applicable taxes (GST or any other statutory levies) shall be charged as per prevailing rates at the time of billing." },
  { title: "Scope exclusions", body: "Installation, testing, and commissioning are not included unless explicitly mentioned in the quotation." },
  { title: "Force majeure", body: "The company shall not be held liable for delays or failure in delivery due to circumstances beyond its control, including but not limited to natural disasters, supply chain disruptions, or regulatory changes." },
  { title: "Amendments", body: "Orders once confirmed cannot be cancelled or modified without prior written consent. Any cancellation may attract applicable charges." },
  { title: "Specifications", body: "Product specifications are subject to improvement and may change without prior notice in line with ongoing product development." },
];

// ── Formatting ──────────────────────────────────────────────────────────

const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const dash = (v?: string) => (v && v.trim() ? v : "—");

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function below1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? " " + ONES[r % 10] : ""}`;
  return [h ? `${ONES[h]} Hundred` : "", rest].filter(Boolean).join(" ");
}
/** 3917151 → "Rupees Thirty Nine Lakh Seventeen Thousand One Hundred Fifty One only" (Indian system). */
export function rupeesInWords(amount: number): string {
  let n = Math.round(amount);
  if (n <= 0) return "Rupees Zero only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${crore >= 1000 ? rupeesInWords(crore).replace(/^Rupees | only$/g, "") : below1000(crore)} Crore`);
  if (lakh) parts.push(`${below1000(lakh)} Lakh`);
  if (thousand) parts.push(`${below1000(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return `Rupees ${parts.join(" ")} only`;
}

const title = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Led|Cob|Smd|Ip\d*|Rgbw?|Cct|Cri|Dc|Ac|Pcb)\b/gi, (m) => m.toUpperCase());

/** Fields the schedule shows, derived from the row's product snapshot. */
function rowView(r: BoqRow) {
  const a = r.attributes, s = r.specs;
  const code = r.code ?? a.model ?? "";
  const rawName = r.name ?? s["Product Name"] ?? a.category ?? code;
  return {
    code,
    name: rawName === code ? rawName : title(rawName),
    ip: a.ip_rating,
    watt: a.watts,
    beam: a.beam_angle,
    cct: a.cct,
    finish: a.body_colors ?? s["Material"],
    dimension: a.dimensions,
  };
}

// ── Grouping & pagination ───────────────────────────────────────────────

type Group = { ref: string; name: string; rows: BoqRow[]; amount: number; qty: number; units: Record<string, number> };

const REFS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const groupRef = (i: number) => (i < 26 ? REFS[i] : `${REFS[Math.floor(i / 26) - 1]}${REFS[i % 26]}`);

function buildGroups(rows: BoqRow[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const key = r.group?.trim() || r.attributes.category || "Products";
    let g = map.get(key);
    if (!g) { g = { ref: "", name: title(key), rows: [], amount: 0, qty: 0, units: {} }; map.set(key, g); }
    g.rows.push(r);
    g.amount += r.total;
    g.qty += r.qty;
    const u = uom(r.unit);
    g.units[u] = (g.units[u] ?? 0) + r.qty;
  }
  return Array.from(map.values()).map((g, i) => ({ ...g, ref: groupRef(i) }));
}

const uom = (unit: string) => (/m(e)?tr|meter|metre/i.test(unit) ? "Mtr" : "Nos");
const unitsText = (units: Record<string, number>) =>
  Object.entries(units).map(([u, n]) => `${inr0(n)} ${u}`).join(" + ");

type Entry =
  | { kind: "band"; group: Group }
  | { kind: "row"; row: BoqRow; n: number };

// Pixel budget per schedule page (body area between header & footer).
const H_BAND = 40, H_ROW = 66, H_FWD = 34;
// Measured from the rendered pages: rows area + room for brought/carried rows.
const SCHED_FIRST_CAP = 600; // first schedule page also has the section intro
const SCHED_CAP = 630;

function paginateSchedule(groups: Group[]): Entry[][] {
  const entries: Entry[] = [];
  let n = 0;
  for (const g of groups) {
    entries.push({ kind: "band", group: g });
    for (const row of g.rows) entries.push({ kind: "row", row, n: ++n });
  }
  const pages: Entry[][] = [];
  let page: Entry[] = [], used = 0, cap = SCHED_FIRST_CAP;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const h = e.kind === "band" ? H_BAND : H_ROW;
    // Keep a band with at least its first row.
    const need = e.kind === "band" ? h + H_ROW : h;
    if (page.length && used + need > cap - H_FWD * 2) {
      pages.push(page); page = []; used = 0; cap = SCHED_CAP;
    }
    page.push(e); used += h;
  }
  if (page.length || !pages.length) pages.push(page);
  return pages;
}

// ── Shared page chrome ──────────────────────────────────────────────────

function Page({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <section
      style={{
        width: PAGE_W,
        height: PAGE_H,
        // linear (not radial) gradient — html2canvas renders it reliably
        background: dark ? `linear-gradient(135deg, ${C.charcoal} 0%, ${C.charcoal2} 55%, ${C.charcoal} 100%)` : "#ffffff",
      }}
      className={`relative flex flex-col overflow-hidden ${BODY}`}
    >
      {children}
    </section>
  );
}

function Logo({ src, dark, className = "" }: { src?: string; dark?: boolean; className?: string }) {
  return src ? (
    <img src={src} alt="LEDLUM" className={`block w-auto ${className}`} />
  ) : (
    <span className={`${HEAD} text-2xl font-bold tracking-[0.12em] ${dark ? "text-white" : ""}`} style={dark ? undefined : { color: C.ink }}>
      LEDLUM
    </span>
  );
}

function RunningHeader({ meta, quoteRef }: { meta: BoqMeta; quoteRef: string }) {
  const project = meta.projectName || meta.project;
  return (
    <header className="mx-14 flex items-start justify-between border-b pb-5 pt-12" style={{ borderColor: C.line }}>
      <div>
        <p className="text-[11px] tracking-[0.22em]" style={{ color: C.muted }}>
          <span className={`${HEAD} font-bold`} style={{ color: C.ink }}>{project ? project.toUpperCase() : "LEDLUM"}</span>
          <span className="mx-2">·</span>Bill of Quantities
        </p>
        <p className="mt-2 text-[10.5px] tracking-[0.22em]" style={{ color: C.muted }}>
          Lighting{meta.location ? <><span className="mx-2">·</span>{meta.location}</> : null}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <Logo src={meta.logoLight} className="h-7" />
        <p className="mt-2 text-[10.5px] tracking-[0.22em]" style={{ color: C.muted }}>{quoteRef}</p>
      </div>
    </header>
  );
}

function RunningFooter({ meta, pageNo, pageCount }: { meta: BoqMeta; pageNo: number; pageCount: number }) {
  const parts = [
    "LEDLUM — Beyond Bright",
    meta.dealerName && `Prepared for ${meta.dealerName}`,
    meta.projectCode && `Project ${meta.projectCode}`,
    meta.preparedBy && `Prepared by ${meta.preparedBy}`,
  ].filter(Boolean);
  return (
    <footer className="mx-14 mt-auto flex items-center justify-between border-t py-4 text-[10px] tracking-[0.18em]"
      style={{ borderColor: C.line, color: C.muted }}>
      <span>{parts.join("  ·  ")}</span>
      <span>Page {pageNo} of {pageCount}</span>
    </footer>
  );
}

function SectionTitle({ no, title: t, intro, continued }: { no: string; title: string; intro?: string; continued?: boolean }) {
  return continued ? (
    <div className="mb-4 flex items-baseline gap-4">
      <span className="text-[10.5px] font-semibold tracking-[0.24em]" style={{ color: C.gold }}>SECTION {no} · CONTINUED</span>
      <span className={`${HEAD} text-[20px] font-semibold`} style={{ color: C.ink }}>{t}</span>
    </div>
  ) : (
    <div className="mb-5">
      <p className="text-[10.5px] font-semibold tracking-[0.24em]" style={{ color: C.gold }}>SECTION {no}</p>
      <h2 className={`${HEAD} mt-2 text-[30px] font-semibold leading-tight`} style={{ color: C.ink }}>{t}</h2>
      {intro && <p className="mt-2 max-w-[1050px] text-[12.5px] leading-relaxed" style={{ color: C.text }}>{intro}</p>}
    </div>
  );
}

function TotalsCard({ totals, hasPrices }: { totals: BoqTotals; hasPrices: boolean }) {
  return (
    <div className="border p-7" style={{ borderColor: C.line, background: C.paper }}>
      {hasPrices ? (
        <>
          <div className="flex items-baseline justify-between border-b pb-3" style={{ borderColor: C.line }}>
            <span className="text-[10.5px] tracking-[0.2em]" style={{ color: C.muted }}>SUB TOTAL</span>
            <span className={`${NUM} text-[19px] font-medium`} style={{ color: C.ink }}>Rs {inr(totals.basic)}</span>
          </div>
          <div className="flex items-baseline justify-between border-b-2 py-3" style={{ borderColor: C.ink }}>
            <span className="text-[10.5px] tracking-[0.2em]" style={{ color: C.muted }}>GST @ {totals.gstRate}%</span>
            <span className={`${NUM} text-[19px] font-medium`} style={{ color: C.ink }}>Rs {inr(totals.gst)}</span>
          </div>
          <p className="mt-5 text-[10.5px] tracking-[0.2em]" style={{ color: C.muted }}>GRAND TOTAL</p>
          <p className={`${NUM} mt-1 text-[30px] font-bold`} style={{ color: C.goldDark }}>Rs {inr0(totals.grand)}</p>
          <p className="mt-3 text-[11.5px] italic leading-snug" style={{ color: C.text }}>{totals.words}</p>
        </>
      ) : (
        <p className="text-[13px]" style={{ color: C.text }}>Prices on request — totals will be confirmed by LEDLUM.</p>
      )}
    </div>
  );
}

// ── Pages ───────────────────────────────────────────────────────────────

function CoverPage({ meta, totals, hasPrices, groups, rows, quoteRef, avgDisc }: {
  meta: BoqMeta; totals: BoqTotals; hasPrices: boolean; groups: Group[]; rows: BoqRow[]; quoteRef: string; avgDisc: number;
}) {
  const project = meta.projectName || meta.project;
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const description =
    `Lighting package${project ? ` for ${project}` : ""}${meta.location ? `, ${meta.location}` : ""} — ` +
    `${rows.length} line item${rows.length === 1 ? "" : "s"} (${inr0(totalQty)} units) across ${groups.length} supply group${groups.length === 1 ? "" : "s"}` +
    (hasPrices && avgDisc > 0 ? `. All rates are net of ${Number.isInteger(avgDisc) ? avgDisc : avgDisc.toFixed(1)}% discount on D.P.` : ".");

  const field = (label: string, value: string, mono = false) => (
    <div key={label}>
      <p className="text-[10px] tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.45)" }}>{label.toUpperCase()}</p>
      <p className={`mt-1.5 min-h-[20px] text-[14px] ${mono ? NUM : ""}`} style={{ color: "rgba(255,255,255,0.9)" }}>{value || " "}</p>
    </div>
  );

  return (
    <Page dark>
      {/* Top gold accent */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${C.goldDark}, ${C.goldBright}, ${C.gold})` }} />

      <div className="flex items-start justify-between px-[74px] pt-12">
        <Logo src={meta.logo} dark className="h-12" />
        <div className="text-right">
          <p className={`${HEAD} text-[12px] font-semibold tracking-[0.24em]`} style={{ color: C.goldBright }}>BILL OF QUANTITIES</p>
          <p className="mt-2 text-[11px] tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.6)" }}>
            {[meta.revisionNo && `Revision ${meta.revisionNo}`, meta.date].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-14 px-[74px] pt-12">
        {/* Left: title */}
        <div className="flex-1">
          <p className="text-[11px] tracking-[0.24em]" style={{ color: C.goldBright }}>LIGHTING  ·  BILL OF QUANTITIES</p>
          <h1 className={`${HEAD} mt-4 text-[58px] font-bold leading-[1.02] text-white`}>{project || "Bill of Quantities"}</h1>
          {meta.location && <p className="mt-2 text-[28px] font-light" style={{ color: C.cream }}>{meta.location}</p>}
          <div className="mt-7 h-[3px] w-28" style={{ background: C.gold }} />
          <p className="mt-7 max-w-[520px] text-[13.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.72)" }}>{description}</p>
        </div>

        {/* Right: grand total card */}
        <div className="mt-[52px] w-[486px] self-start border p-10"
          style={{ borderColor: "rgba(154,140,102,0.55)", background: "rgba(255,255,255,0.035)" }}>
          {hasPrices ? (
            <>
              <p className="text-[10.5px] tracking-[0.24em]" style={{ color: C.goldBright }}>GRAND TOTAL  ·  INCL. GST</p>
              <p className={`${NUM} mt-4 text-[50px] font-bold leading-none text-white`}>Rs {inr0(totals.grand)}</p>
              <p className="mt-4 text-[12.5px] italic leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>{totals.words}</p>
              <div className="mt-6 grid grid-cols-2 gap-6 border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <div>
                  <p className="text-[10px] tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.45)" }}>SUB TOTAL</p>
                  <p className={`${NUM} mt-1.5 text-[17px]`} style={{ color: "rgba(255,255,255,0.88)" }}>Rs {inr(totals.basic)}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.45)" }}>GST @ {totals.gstRate}%</p>
                  <p className={`${NUM} mt-1.5 text-[17px]`} style={{ color: "rgba(255,255,255,0.88)" }}>Rs {inr(totals.gst)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10.5px] tracking-[0.24em]" style={{ color: C.goldBright }}>QUOTATION</p>
              <p className={`${HEAD} mt-4 text-[32px] font-bold text-white`}>Prices on request</p>
              <p className="mt-3 text-[12.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>{rows.length} line items · {inr0(totalQty)} units</p>
            </>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="mx-[74px] grid grid-cols-5 gap-x-10 gap-y-6 border-t pt-7"
        style={{ borderColor: "rgba(255,255,255,0.16)" }}>
        {field("Prepared for", meta.dealerName)}
        {field("Project code", meta.projectCode, true)}
        {field("Location", meta.location)}
        {field("Architect", meta.architectName)}
        {field("Architect PAN", meta.architectPan, true)}
        {field("Scope", `${groups.length} supply group${groups.length === 1 ? "" : "s"} · ${rows.length} items`)}
        {field("Date", meta.date)}
        {field("Revision", meta.revisionNo, true)}
        {field("Prepared by", meta.preparedBy)}
        {field("Channel partner", meta.dealerName)}
      </div>

      <div className="mx-[74px] mb-9 mt-8 flex justify-between border-t pt-5 text-[10.5px] tracking-[0.12em]"
        style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}>
        <span>{COMPANY_NAME} · {meta.companyAddress}</span>
        <span>{quoteRef}</span>
      </div>
    </Page>
  );
}

function SummaryPage({ meta, groups, rows, totals, hasPrices, quoteRef, pageNo, pageCount, avgDisc }: {
  meta: BoqMeta; groups: Group[]; rows: BoqRow[]; totals: BoqTotals; hasPrices: boolean;
  quoteRef: string; pageNo: number; pageCount: number; avgDisc: number;
}) {
  const nos = rows.filter((r) => uom(r.unit) === "Nos").reduce((s, r) => s + r.qty, 0);
  const mtr = rows.filter((r) => uom(r.unit) === "Mtr").reduce((s, r) => s + r.qty, 0);
  const biggest = [...groups].sort((a, b) => b.amount - a.amount)[0];
  const share = (g: Group) => (totals.basic > 0 ? (g.amount / totals.basic) * 100 : 0);
  const maxShare = Math.max(1, ...groups.map(share));

  const tiles: [string, string, string][] = [
    [inr0(rows.length), "", "Line items"],
    [inr0(nos), "Nos", "Units"],
    ...(mtr ? [[inr0(mtr), "Mtr", "Strip & profile"] as [string, string, string]] : []),
    [String(groups.length), "", "Supply groups"],
    ...(hasPrices ? [[`${Number.isInteger(avgDisc) ? avgDisc : avgDisc.toFixed(1)}`, "%", "Avg. discount"] as [string, string, string]] : []),
    ...(hasPrices ? [[`${(totals.basic / 1e5).toFixed(2)}`, "L", "Value before GST"] as [string, string, string]] : []),
  ];

  const intro = `The package is organised into ${groups.length} supply group${groups.length === 1 ? "" : "s"} by product type.` +
    (hasPrices && biggest
      ? ` ${biggest.name} carries the largest share of order value at ${share(biggest).toFixed(1)}%.`
      : "") +
    (hasPrices && avgDisc > 0 ? " Every amount is net of the stated discount on D.P." : "");

  // Long group lists: fit by shrinking row height; beyond ~14 groups, show the rest compactly.
  const rowH = groups.length > 11 ? 28 : 38;

  return (
    <Page>
      <RunningHeader meta={meta} quoteRef={quoteRef} />
      <div className="flex-1 px-14 pt-7">
        <SectionTitle no="01" title="Commercial summary" intro={intro} />

        <div className="grid border" style={{ borderColor: C.line, gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))` }}>
          {tiles.map(([v, u, l], i) => (
            <div key={l} className={`px-5 py-4 ${i ? "border-l" : ""}`} style={{ borderColor: C.line }}>
              <p>
                <span className={`${NUM} text-[30px] font-bold`} style={{ color: C.ink }}>{v}</span>
                {u && <span className={`${HEAD} ml-1 text-[14px]`} style={{ color: C.muted }}>{u}</span>}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.22em]" style={{ color: C.muted }}>{l.toUpperCase()}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-8">
          <table className="flex-1 self-start border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 text-left text-[10px] tracking-[0.2em]" style={{ borderColor: C.ink, color: C.muted }}>
                <th className="py-2.5 pr-3 font-medium">REF  SUPPLY GROUP</th>
                <th className="px-3 py-2.5 font-medium">QUANTITY</th>
                <th className="px-3 py-2.5 text-right font-medium">LINES</th>
                {hasPrices && <th className="px-3 py-2.5 font-medium">SHARE OF VALUE</th>}
                {hasPrices && <th className="px-3 py-2.5 text-right font-medium">%</th>}
                {hasPrices && <th className="py-2.5 pl-3 text-right font-medium">AMOUNT (RS)</th>}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.ref} className="border-b" style={{ borderColor: C.line, height: rowH }}>
                  <td className="pr-3">
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white" style={{ background: C.charcoal }}>{g.ref}</span>
                    <span style={{ color: C.ink }}>{g.name}</span>
                  </td>
                  <td className={`${NUM} px-3 text-[12px]`} style={{ color: C.text }}>{unitsText(g.units)}</td>
                  <td className={`${NUM} px-3 text-right`} style={{ color: C.ink }}>{g.rows.length}</td>
                  {hasPrices && (
                    <td className="px-3">
                      <div className="h-[5px]" style={{ width: `${Math.max(2, (share(g) / maxShare) * 120)}px`, background: C.gold }} />
                    </td>
                  )}
                  {hasPrices && <td className={`${NUM} px-3 text-right`} style={{ color: C.text }}>{share(g).toFixed(1)}%</td>}
                  {hasPrices && <td className={`${NUM} pl-3 text-right font-medium`} style={{ color: C.ink }}>{inr(g.amount)}</td>}
                </tr>
              ))}
              <tr className="font-bold" style={{ color: C.ink, height: 40 }}>
                <td className="pr-3">Sub total, before GST</td>
                <td />
                <td className={`${NUM} px-3 text-right`}>{rows.length}</td>
                {hasPrices && <td />}
                {hasPrices && <td className={`${NUM} px-3 text-right`}>100%</td>}
                {hasPrices && <td className={`${NUM} pl-3 text-right`}>{inr(totals.basic)}</td>}
              </tr>
            </tbody>
          </table>

          <div className="w-[320px] flex-shrink-0">
            <TotalsCard totals={totals} hasPrices={hasPrices} />
            <p className="mt-4 text-[10.5px] leading-relaxed" style={{ color: C.muted }}>
              All rates are net, ex-works, and exclude packing, forwarding, freight, insurance, installation, testing and
              commissioning. GST is applied at {totals.gstRate}% on the sub total. Quantities are as per the issued
              schedule and subject to final site measurement.
            </p>
          </div>
        </div>
      </div>
      <RunningFooter meta={meta} pageNo={pageNo} pageCount={pageCount} />
    </Page>
  );
}

function SchedulePage({ meta, entries, first, brought, carried, isLastSchedule, totals, hasPrices, quoteRef, pageNo, pageCount }: {
  meta: BoqMeta; entries: Entry[]; first: boolean; brought: number; carried: number; isLastSchedule: boolean;
  totals: BoqTotals; hasPrices: boolean; quoteRef: string; pageNo: number; pageCount: number;
}) {
  const th = "py-2.5 px-2 text-[9.5px] font-medium tracking-[0.18em] whitespace-nowrap";
  const td = "px-2 align-middle";
  const cols = hasPrices ? 14 : 10;
  return (
    <Page>
      <RunningHeader meta={meta} quoteRef={quoteRef} />
      <div className="flex-1 px-14 pt-7">
        <SectionTitle
          no="02"
          title="Itemised schedule"
          continued={!first}
          intro="Full bill of quantities grouped by supply group. Each band lists its products with specification, quantity, D.P., discount and net rate, with the group subtotal in the band."
        />
        <table className="w-full border-collapse text-[12px]" style={{ color: C.ink }}>
          <thead>
            <tr className="border-b-2 text-left" style={{ borderColor: C.ink, color: C.muted }}>
              <th className={`${th} w-8 pl-1`}>#</th>
              <th className={`${th} w-[60px]`}>IMAGE</th>
              <th className={th}>PRODUCT &amp; CODE</th>
              <th className={th}>WATT</th>
              <th className={th}>BEAM</th>
              <th className={th}>CCT</th>
              <th className={th}>FINISH</th>
              <th className={th}>DIMENSION</th>
              <th className={`${th} text-right`}>QTY</th>
              <th className={th}>UOM</th>
              {hasPrices && <th className={`${th} text-right`}>D.P.</th>}
              {hasPrices && <th className={`${th} text-right`}>DISC</th>}
              {hasPrices && <th className={`${th} text-right`}>NET RATE</th>}
              {hasPrices && <th className={`${th} pr-1 text-right`}>AMOUNT</th>}
            </tr>
          </thead>
          <tbody>
            {!first && hasPrices && (
              <tr className="border-b" style={{ borderColor: C.line, background: C.paper, height: H_FWD }}>
                <td colSpan={cols - 1} className="px-2 text-[10px] tracking-[0.18em]" style={{ color: C.muted }}>BROUGHT FORWARD FROM PREVIOUS PAGE</td>
                <td className={`${NUM} pr-1 text-right font-bold`}>Rs {inr(brought)}</td>
              </tr>
            )}
            {entries.map((e) =>
              e.kind === "band" ? (
                <tr key={`band-${e.group.ref}`} className="border-b" style={{ borderColor: C.line, background: C.paper, height: H_BAND }}>
                  <td colSpan={hasPrices ? 7 : 7} className="px-1">
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white" style={{ background: C.charcoal }}>{e.group.ref}</span>
                    <span className={`${HEAD} text-[12.5px] font-bold tracking-[0.04em]`}>{e.group.name}</span>
                  </td>
                  <td colSpan={hasPrices ? 3 : 3} className="px-2 text-[10.5px] tracking-[0.16em]" style={{ color: C.muted }}>
                    {e.group.rows.length} item{e.group.rows.length === 1 ? "" : "s"}
                  </td>
                  {hasPrices && (
                    <td colSpan={4} className="pr-1 text-right">
                      <span className="mr-3 text-[10.5px] tracking-[0.14em]" style={{ color: C.muted }}>Group subtotal</span>
                      <span className={`${NUM} text-[13px] font-bold`}>Rs {inr(e.group.amount)}</span>
                    </td>
                  )}
                </tr>
              ) : (
                (() => {
                  const v = rowView(e.row);
                  return (
                    <tr key={`row-${e.n}`} className="border-b" style={{ borderColor: C.line, height: H_ROW }}>
                      <td className={`${td} pl-1 ${NUM}`} style={{ color: C.muted }}>{e.n}</td>
                      <td className={td}>
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden border bg-white" style={{ borderColor: C.line }}>
                          {e.row.image
                            ? <img src={e.row.image} alt="" width={48} height={48} className="block" />
                            : <span className="text-[8px]" style={{ color: C.muted }}>IMAGE</span>}
                        </div>
                      </td>
                      <td className={`${td} max-w-[250px]`}>
                        <p className="text-[12px] font-semibold leading-snug">
                          {v.name}
                          {v.ip && <span style={{ color: C.muted }}> · {v.ip}</span>}
                        </p>
                        <p className={`${NUM} mt-0.5 text-[10.5px] tracking-[0.04em]`} style={{ color: C.muted }}>{v.code}</p>
                      </td>
                      <td className={`${td} ${NUM}`}>{dash(v.watt)}</td>
                      <td className={`${td} ${NUM}`}>{dash(v.beam)}</td>
                      <td className={`${td} ${NUM} max-w-[90px]`}>{dash(v.cct)}</td>
                      <td className={`${td} max-w-[100px] text-[11.5px]`}>{dash(v.finish)}</td>
                      <td className={`${td} ${NUM} max-w-[120px] text-[11.5px]`}>{dash(v.dimension)}</td>
                      <td className={`${td} ${NUM} text-right font-semibold`}>{inr0(e.row.qty)}</td>
                      <td className={td} style={{ color: C.text }}>{uom(e.row.unit)}</td>
                      {hasPrices && <td className={`${td} ${NUM} text-right`} style={{ color: C.muted }}>{e.row.mrp ? inr(e.row.mrp) : "—"}</td>}
                      {hasPrices && <td className={`${td} ${NUM} text-right`} style={{ color: C.goldDark }}>{e.row.disc ? `${e.row.disc}%` : "—"}</td>}
                      {hasPrices && <td className={`${td} ${NUM} text-right`}>{e.row.net ? inr(e.row.net) : "—"}</td>}
                      {hasPrices && <td className={`${td} ${NUM} pr-1 text-right font-bold`}>{e.row.total ? inr(e.row.total) : "—"}</td>}
                    </tr>
                  );
                })()
              ),
            )}
            {hasPrices && (
              <tr style={{ height: H_FWD }}>
                <td colSpan={cols - 1} className="px-2 text-[10px] tracking-[0.18em]" style={{ color: C.muted }}>
                  {isLastSchedule ? "SUB TOTAL, BEFORE GST" : "CARRIED FORWARD"}
                </td>
                <td className={`${NUM} pr-1 text-right text-[13px] font-bold`}>Rs {inr(isLastSchedule ? totals.basic : carried)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <RunningFooter meta={meta} pageNo={pageNo} pageCount={pageCount} />
    </Page>
  );
}

function TermsPage({ meta, totals, hasPrices, quoteRef, pageNo, pageCount }: {
  meta: BoqMeta; totals: BoqTotals; hasPrices: boolean; quoteRef: string; pageNo: number; pageCount: number;
}) {
  const half = Math.ceil(TERMS.length / 2);
  const term = (t: (typeof TERMS)[number], i: number) => (
    <div key={t.title} className="border-b py-2.5" style={{ borderColor: C.line }}>
      <p className="text-[10px] tracking-[0.2em]">
        <span className={`${HEAD} mr-2 font-bold`} style={{ color: C.gold }}>{String(i + 1).padStart(2, "0")}</span>
        <span style={{ color: C.muted }}>{t.title.toUpperCase()}</span>
      </p>
      <p className="mt-1 text-[11px] leading-[1.55]" style={{ color: C.text }}>{t.body}</p>
    </div>
  );
  const strip = (heading: string, caption: string) => (
    <div key={heading} className="border-t-2 pt-3" style={{ borderColor: C.ink }}>
      <p className={`${HEAD} text-[11px] font-bold tracking-[0.2em]`} style={{ color: C.ink }}>{heading}</p>
      <div className="mt-10 border-t border-dashed pt-2" style={{ borderColor: "#cfc8ba" }}>
        <p className="text-[10px] tracking-[0.08em]" style={{ color: C.muted }}>{caption}</p>
      </div>
    </div>
  );
  return (
    <Page>
      <RunningHeader meta={meta} quoteRef={quoteRef} />
      <div className="flex-1 px-14 pt-7">
        <SectionTitle
          no="03"
          title="Terms & conditions"
          intro={`The commercial terms below govern this quotation. Acceptance is by signature of the strip at the foot of this page, or by issue of a purchase order referencing ${quoteRef || "this quotation"}.`}
        />
        <div className="flex gap-10">
          <div className="grid flex-1 grid-cols-2 gap-x-10">
            <div>{TERMS.slice(0, half).map((t, i) => term(t, i))}</div>
            <div>{TERMS.slice(half).map((t, i) => term(t, i + half))}</div>
          </div>
          <div className="w-[300px] flex-shrink-0">
            <TotalsCard totals={totals} hasPrices={hasPrices} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-10 pb-2">
          {strip("FOR LEDLUM", "Authorised signatory · name, designation, date")}
          {strip(`ACCEPTED FOR ${(meta.dealerName || "CLIENT").toUpperCase()}`, "Authorised signatory · name, designation, date")}
          {strip("PURCHASE ORDER REFERENCE", "PO number · date · value")}
        </div>
      </div>
      <RunningFooter meta={meta} pageNo={pageNo} pageCount={pageCount} />
    </Page>
  );
}

// ── Document ────────────────────────────────────────────────────────────

/**
 * Full BOQ: cover → commercial summary → itemised schedule (paginated) → terms.
 * Every <section> is one fixed-size page for the PDF exporter.
 */
export default function BOQDocument({ meta, rows, totals }: { meta: BoqMeta; rows: BoqRow[]; totals?: BoqTotals; rowsPerPage?: number }) {
  const basic = totals?.basic ?? rows.reduce((s, r) => s + r.total, 0);
  const gstRate = totals?.gstRate ?? 18;
  const gst = totals?.gst ?? Math.round(basic * gstRate) / 100;
  const grand = totals?.grand ?? Math.round(basic + gst);
  const resolved: BoqTotals = { basic, gstRate, gst, grand, words: totals?.words || rupeesInWords(grand) };
  const hasPrices = basic > 0;

  // Value-weighted average discount (for the cover/summary copy).
  const gross = rows.reduce((s, r) => s + r.mrp * r.qty, 0);
  const avgDisc = gross > 0 ? Math.round(((gross - basic) / gross) * 1000) / 10 : 0;

  const groups = buildGroups(rows);
  const schedule = paginateSchedule(groups);
  const pageCount = 2 + schedule.length + 1;
  const quoteRef = [meta.projectCode && `Quotation ${meta.projectCode}`, meta.revisionNo && `Rev ${meta.revisionNo}`]
    .filter(Boolean).join(" · ") || "Quotation";

  // Running totals for carried / brought forward.
  let running = 0;
  const forward = schedule.map((entries) => {
    const brought = running;
    for (const e of entries) if (e.kind === "row") running += e.row.total;
    return { brought, carried: running };
  });

  return (
    <div className="bg-white text-[#171717] antialiased" style={{ width: PAGE_W }}>
      <CoverPage meta={meta} totals={resolved} hasPrices={hasPrices} groups={groups} rows={rows} quoteRef={quoteRef} avgDisc={avgDisc} />
      <SummaryPage meta={meta} groups={groups} rows={rows} totals={resolved} hasPrices={hasPrices}
        quoteRef={quoteRef} pageNo={2} pageCount={pageCount} avgDisc={avgDisc} />
      {schedule.map((entries, i) => (
        <SchedulePage
          key={i}
          meta={meta}
          entries={entries}
          first={i === 0}
          brought={forward[i].brought}
          carried={forward[i].carried}
          isLastSchedule={i === schedule.length - 1}
          totals={resolved}
          hasPrices={hasPrices}
          quoteRef={quoteRef}
          pageNo={3 + i}
          pageCount={pageCount}
        />
      ))}
      <TermsPage meta={meta} totals={resolved} hasPrices={hasPrices} quoteRef={quoteRef} pageNo={pageCount} pageCount={pageCount} />
    </div>
  );
}

// ── Sample data / helpers kept for callers ──────────────────────────────

export const SAMPLE_META: BoqMeta = {
  date: "19-06-2026",
  revisionNo: "00",
  project: "R.K. Salai Experience Centre",
  projectCode: "1040",
  location: "Chennai",
  preparedBy: "-",
  projectName: "R.K. Salai Experience Centre",
  architectName: "-",
  architectPan: "-",
  dealerName: "-",
  companyAddress: LEDLUM_ADDRESS,
};

/** Header for a real quote: everything blank except what's passed in. */
export function blankMeta(fields: Partial<BoqMeta>): BoqMeta {
  return {
    date: "", revisionNo: "", project: "", projectCode: "", location: "", preparedBy: "",
    projectName: "", architectName: "", architectPan: "", dealerName: "",
    companyAddress: LEDLUM_ADDRESS,
    ...fields,
  };
}

export const SAMPLE_TOTALS: BoqTotals = {
  basic: 284748,
  gstRate: 18,
  gst: 51254.64,
  grand: 336003,
  words: "Rupees Three Lakh Thirty Six Thousand Three only",
};
