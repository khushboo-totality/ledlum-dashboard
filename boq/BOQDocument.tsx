// Ledlum — Bill of Quantities
// Tailwind CSS (v3+). Load Poppins (400/500/600/700) in the host document's <head>:
// https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap

import type { ReactNode } from "react";
import { formatColumnTitle } from "@/lib/productColumns";

export type BoqRow = {
  slNo: number;
  image?: string;
  /** DB column -> display value (see lib/productColumns.ts), in table order. */
  attributes: Record<string, string>;
  /** extra_specs key -> value; each key becomes its own column. */
  specs: Record<string, string>;
  qty: number;
  unit: string;
  mrp: number;
  disc: number; // percent
  net: number;
  total: number;
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
  architectContact: string;
  architectPan: string;
  dealerName: string;
  companyAddress: string;
  /** Prepared (cropped, white-on-dark) logo data URL — see prepareLogoForDarkHeader. */
  logo?: string;
};

export const TERMS = [
  "Delivery within 4 to 5 weeks for all items after confirmation of purchase order",
  "This price is valid only 15 days from date of quote",
  "Payment 100% advance with confirmed purchase order.",
  "Goods sold or sent against order will not be taken back or exchanged",
  "Stock as per subject to availability. Kindly enquire before finalizing",
  "Packing & forwarding charges not including in this quote.",
];

const inr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type BoqCol = {
  id: string;
  label: string;
  className: string;
  render: (row: BoqRow) => ReactNode;
};

const td = "px-3 py-6";

// Fixed columns around the data-driven ones. Everything between Image and
// Qty comes from the product table itself (see buildColumns).
const SL_NO_COL: BoqCol = { id: "slNo", label: "Sl.No", className: "w-14 text-left", render: (r) => r.slNo };
const IMAGE_COL: BoqCol = {
  id: "image",
  label: "Product Image",
  className: "w-[130px] text-center",
  render: (r) => (
    <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden border border-black/[0.06] bg-white">
      {r.image ? (
        <img src={r.image} alt="" width={80} height={80} className="block" />
      ) : (
        <span className="text-[10px] uppercase tracking-wide text-black/25">Image</span>
      )}
    </div>
  ),
};
const QTY_COLS: BoqCol[] = [
  { id: "qty", label: "Qty", className: "w-16 text-center", render: (r) => r.qty },
  { id: "unit", label: "Unit", className: "w-16 text-center", render: (r) => r.unit },
];
// Only shown once real pricing exists (hidden while every row is 0).
const PRICE_COLS: (BoqCol & { value: (r: BoqRow) => number })[] = [
  { id: "mrp", label: "MRP (₹)", className: "w-24 text-right", value: (r) => r.mrp, render: (r) => inr(r.mrp) },
  { id: "disc", label: "Disc", className: "w-16 text-right", value: (r) => r.disc, render: (r) => `${r.disc}%` },
  { id: "net", label: "Net (₹)", className: "w-24 text-right", value: (r) => r.net, render: (r) => inr(r.net) },
  { id: "total", label: "Total (₹)", className: "w-[116px] text-right font-bold", value: (r) => r.total, render: (r) => inr(r.total) },
];

/** Keys across all rows, in first-seen order (so the table's column order is kept). */
function unionKeys(maps: Record<string, string>[]): string[] {
  const seen = new Set<string>();
  for (const m of maps) for (const k of Object.keys(m)) seen.add(k);
  return Array.from(seen);
}

/**
 * Column set for the whole document (computed once across all rows so every
 * page has the same columns): the product table's own columns, then one
 * column per extra_specs key, titled from the key itself.
 */
function buildColumns(rows: BoqRow[]): BoqCol[] {
  const attrCols: BoqCol[] = unionKeys(rows.map((r) => r.attributes)).map((key) => ({
    id: `attr:${key}`,
    label: formatColumnTitle(key),
    className: key === "model" ? "min-w-[110px] text-center font-semibold" : "min-w-[90px] text-center",
    render: (r) => r.attributes[key] ?? "—",
  }));
  const specCols: BoqCol[] = unionKeys(rows.map((r) => r.specs)).map((key) => ({
    id: `spec:${key}`,
    label: formatColumnTitle(key),
    className: "min-w-[90px] text-center",
    render: (r) => r.specs[key] ?? "—",
  }));
  const priceCols = PRICE_COLS.filter((c) => rows.some((r) => c.value(r) !== 0));
  return [SL_NO_COL, IMAGE_COL, ...attrCols, ...specCols, ...QTY_COLS, ...priceCols];
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b08d57]">
        {label}:
      </span>
      <span className="text-[12px] font-medium uppercase tracking-wide text-white">{value}</span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 first:pl-0">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">
        {label}
      </div>
      <div className="text-[13px] text-white/90">{value}</div>
    </div>
  );
}

function Masthead({ meta }: { meta: BoqMeta }) {
  return (
    <header className="bg-[#12100f] px-10 pt-8 pb-0">
      <div className="flex items-start justify-between gap-12 pb-7">
        {meta.logo ? (
          <img src={meta.logo} alt="LEDLUM" className="block h-14 w-auto" />
        ) : (
          <span className="text-3xl font-bold tracking-[0.06em] text-white">LEDLUM</span>
        )}

        <div className="grid grid-cols-[repeat(3,auto)] gap-x-14 gap-y-3">
          <MetaField label="Date" value={meta.date} />
          <MetaField label="Project" value={meta.project} />
          <MetaField label="Location" value={meta.location} />
          <MetaField label="Revision No" value={meta.revisionNo} />
          <MetaField label="Project Code" value={meta.projectCode} />
          <MetaField label="BOQ Prepared By" value={meta.preparedBy} />
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-white/15 border-t border-white/15 py-[26px]">
        <DetailField label="Project Name" value={meta.projectName} />
        <DetailField label="Location" value={meta.location} />
        <DetailField label="Architect Email & Number" value={meta.architectContact} />
        <DetailField label="Architect PAN" value={meta.architectPan} />
        <DetailField label="Dealer Name" value={meta.dealerName} />
      </div>
    </header>
  );
}

/** One printed/scrolled page: repeated masthead + title + its slice of rows. */
function BoqPage({
  meta,
  rows,
  visibleCols,
  pageNo,
  pageCount,
  isLast,
  totals,
  startIndex,
}: {
  meta: BoqMeta;
  rows: BoqRow[];
  visibleCols: BoqCol[];
  pageNo: number;
  pageCount: number;
  isLast: boolean;
  totals: BoqTotals;
  startIndex: number;
}) {
  return (
    <section className="break-after-page bg-white last:break-after-auto">
      <Masthead meta={meta} />

      <div className="px-10 py-7">
        <h1 className="text-[19px] font-bold uppercase tracking-[0.04em] text-[#b08d57]">
          Bill of Quantities — {meta.projectName}
        </h1>
      </div>

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-[#12100f]">
            {visibleCols.map((c) => (
              <th
                key={c.id}
                className={`${c.className} whitespace-nowrap px-3 py-4 text-[12px] font-semibold tracking-[0.03em] text-white first:pl-10 last:pr-10`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.slNo}
              className={`border-b border-black/10 ${(startIndex + i) % 2 ? "bg-[#f7f7f7]" : "bg-white"}`}
            >
              {visibleCols.map((c) => (
                <td key={c.id} className={`${c.className} ${td} text-[#555] first:pl-10 last:pr-10`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {isLast && (
        <div className="px-10 pt-11">
          <div className="grid grid-cols-2 items-start gap-14">
            <div>
              <h2 className="mb-[26px] text-[16px] font-bold uppercase tracking-[0.04em]">
                Terms &amp; Conditions
              </h2>
              <ol className="grid list-decimal gap-3.5 pl-[22px] text-[11.5px] uppercase tracking-[0.05em] text-[#3d3a37]">
                {TERMS.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ol>
            </div>

            <div className="bg-[#12100f] px-[34px] py-8 text-white">
              <div className="flex items-baseline justify-between gap-6 pb-[18px]">
                <span className="text-[13.5px] uppercase tracking-[0.04em]">Basic Amount (in Rs.)</span>
                <span className="text-[14px] font-semibold text-[#b08d57]">₹ {inr(totals.basic)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-6 pb-[18px]">
                <span className="text-[13.5px] uppercase tracking-[0.04em]">
                  GST @ {totals.gstRate}% (in Rs.)
                </span>
                <span className="text-[14px] font-semibold text-[#b08d57]">₹ {inr(totals.gst)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-b border-white/[0.18] pb-5">
                <span className="text-[14px] font-bold uppercase tracking-[0.04em]">
                  Grand Total (in Rs.)
                </span>
                <span className="text-[22px] font-bold text-[#b08d57]">₹ {inr(totals.grand)}</span>
              </div>
              <p className="pt-[18px] text-[11.5px] tracking-[0.03em] text-white/55">{totals.words}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 justify-items-center gap-14 pb-16 pt-[120px]">
            {["Prepared By", "Checked By", "Approved By"].map((label) => (
              <div key={label} className="w-full max-w-64 text-center">
                <div className="border-t border-black/55 pt-3.5 text-[14px] font-semibold">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-6 bg-[#12100f] px-10 py-[22px]">
        <span className="text-[12px] tracking-[0.02em] text-white/75">{meta.companyAddress}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b08d57]">
          Page {pageNo} of {pageCount}
        </span>
      </div>
    </section>
  );
}

/**
 * Full BOQ document. Rows are split into pages of `rowsPerPage`; every page
 * repeats the masthead and column header, and the grand total prints once, on
 * the last page.
 */
export default function BOQDocument({
  meta,
  rows,
  totals,
  rowsPerPage = 10,
}: {
  meta: BoqMeta;
  rows: BoqRow[];
  totals?: BoqTotals;
  rowsPerPage?: number;
}) {
  const basic = totals?.basic ?? rows.reduce((s, r) => s + r.total, 0);
  const gstRate = totals?.gstRate ?? 18;
  const resolved: BoqTotals = {
    basic,
    gstRate,
    gst: totals?.gst ?? (basic * gstRate) / 100,
    grand: totals?.grand ?? Math.round(basic * (1 + gstRate / 100)),
    words: totals?.words ?? "",
  };
  const pages: BoqRow[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) pages.push(rows.slice(i, i + rowsPerPage));
  if (!pages.length) pages.push([]);

  // Computed once across all rows so the column set stays consistent across
  // pages of a multi-page document, not just what a single page happens to have.
  const visibleCols = buildColumns(rows);

  return (
    <div className="overflow-x-auto bg-white">
      <div className="min-w-[1600px] font-[Poppins,system-ui,sans-serif] text-[#1a1a1a] antialiased">
        {pages.map((pageRows, i) => (
          <BoqPage
            key={i}
            meta={meta}
            rows={pageRows}
            visibleCols={visibleCols}
            pageNo={i + 1}
            pageCount={pages.length}
            isLast={i === pages.length - 1}
            totals={resolved}
            startIndex={i * rowsPerPage}
          />
        ))}
      </div>
    </div>
  );
}

export const SAMPLE_META: BoqMeta = {
  date: "19-06-2026",
  revisionNo: "-",
  project: "R.K. Salai Experience Centre",
  projectCode: "1040",
  location: "Chennai",
  preparedBy: "-",
  projectName: "R.K. Salai Experience Centre",
  architectContact: "-",
  architectPan: "-",
  dealerName: "-",
  companyAddress: "No. 22A, 1st Floor, 7th Street, Sector 3, Ambattur, Chennai - 600098",
};

export const SAMPLE_TOTALS: BoqTotals = {
  basic: 284748,
  gstRate: 18,
  gst: 51254.64,
  grand: 336003,
  words: "Rupees Three Lakhs Thirty Six Thousand Three Only",
};
