// Ledlum — Bill of Quantities
// Tailwind CSS (v3+). Load Poppins (400/500/600/700) in the host document's <head>:
// https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap

export type BoqRow = {
  slNo: number;
  description: string;
  image?: string;
  type: string;
  code: string;
  watt: string;
  beam: string;
  cct: string;
  auto: string;
  color: string;
  family?: string;
  collection?: string; // indoor / outdoor
  ipRating?: string;
  ledChip?: string;
  cri?: string;
  luminous?: string;
  specifications?: string; // free-form "Key: Value; Key: Value" from a product's extra_specs
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

const COLS = [
  { key: "slNo", label: "Sl.No", className: "w-14 text-left" },
  { key: "description", label: "Product Description", className: "min-w-[220px] text-left" },
  { key: "image", label: "Product Image", className: "w-[130px] text-center" },
  { key: "type", label: "Type", className: "w-20 text-center" },
  { key: "code", label: "Code", className: "w-28 text-center" },
  { key: "watt", label: "Watt", className: "w-20 text-center" },
  { key: "beam", label: "Beam", className: "w-20 text-center" },
  { key: "cct", label: "CCT", className: "w-20 text-center" },
  { key: "auto", label: "Auto", className: "w-24 text-center" },
  { key: "color", label: "Color", className: "w-[130px] text-center" },
  { key: "family", label: "Family", className: "w-28 text-center" },
  { key: "collection", label: "Indoor/Outdoor", className: "w-24 text-center capitalize" },
  { key: "ipRating", label: "IP Rating", className: "w-20 text-center" },
  { key: "ledChip", label: "LED Chip", className: "w-24 text-center" },
  { key: "cri", label: "CRI", className: "w-16 text-center" },
  { key: "luminous", label: "Luminous", className: "w-24 text-center" },
  { key: "specifications", label: "Specifications", className: "min-w-[220px] text-left" },
  { key: "qty", label: "Qty", className: "w-16 text-center" },
  { key: "unit", label: "Unit", className: "w-16 text-center" },
  { key: "mrp", label: "MRP (₹)", className: "w-24 text-right" },
  { key: "disc", label: "Disc", className: "w-16 text-right" },
  { key: "net", label: "Net (₹)", className: "w-24 text-right" },
  { key: "total", label: "Total (₹)", className: "w-[116px] text-right" },
] as const;

type ColKey = (typeof COLS)[number]["key"];

// Always shown regardless of data — everything else only appears if at
// least one row actually has a value for it (so a single-product download
// only shows the columns that product's data actually populates).
const ALWAYS_VISIBLE_COLS = new Set<ColKey>(["slNo", "description", "qty", "unit"]);

function hasValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "" && v.trim() !== "—" && v.trim() !== "-";
  if (typeof v === "number") return v !== 0;
  return true;
}

function getVisibleCols(rows: BoqRow[]) {
  return COLS.filter(
    (c) => ALWAYS_VISIBLE_COLS.has(c.key) || rows.some((r) => hasValue(r[c.key as keyof BoqRow]))
  );
}

function BoqCell({ colKey, row }: { colKey: ColKey; row: BoqRow }) {
  switch (colKey) {
    case "slNo":
      return <td className="px-3 py-6 text-[#555] first:pl-10">{row.slNo}</td>;
    case "description":
      return <td className="px-3 py-6 font-semibold uppercase tracking-[0.02em]">{row.description}</td>;
    case "image":
      return (
        <td className="px-3 py-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden border border-black/[0.06] bg-white">
            {row.image ? (
              <img src={row.image} alt={row.description} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-black/25">Image</span>
            )}
          </div>
        </td>
      );
    case "type":
      return <td className="px-3 py-6 text-center text-[#555]">{row.type}</td>;
    case "code":
      return <td className="px-3 py-6 text-center text-[#555]">{row.code}</td>;
    case "watt":
      return <td className="px-3 py-6 text-center text-[#555]">{row.watt}</td>;
    case "beam":
      return <td className="px-3 py-6 text-center text-[#555]">{row.beam}</td>;
    case "cct":
      return <td className="px-3 py-6 text-center text-[#555]">{row.cct}</td>;
    case "auto":
      return <td className="px-3 py-6 text-center text-[#555]">{row.auto}</td>;
    case "color":
      return <td className="px-3 py-6 text-center uppercase text-[#555]">{row.color}</td>;
    case "family":
      return <td className="px-3 py-6 text-center text-[#555]">{row.family}</td>;
    case "collection":
      return <td className="px-3 py-6 text-center capitalize text-[#555]">{row.collection}</td>;
    case "ipRating":
      return <td className="px-3 py-6 text-center text-[#555]">{row.ipRating}</td>;
    case "ledChip":
      return <td className="px-3 py-6 text-center text-[#555]">{row.ledChip}</td>;
    case "cri":
      return <td className="px-3 py-6 text-center text-[#555]">{row.cri}</td>;
    case "luminous":
      return <td className="px-3 py-6 text-center text-[#555]">{row.luminous}</td>;
    case "specifications":
      return <td className="px-3 py-6 text-left text-[11.5px] leading-snug text-[#555]">{row.specifications}</td>;
    case "qty":
      return <td className="px-3 py-6 text-center last:pr-10">{row.qty}</td>;
    case "unit":
      return <td className="px-3 py-6 text-center text-[#555] last:pr-10">{row.unit}</td>;
    case "mrp":
      return <td className="px-3 py-6 text-right text-[#555]">{inr(row.mrp)}</td>;
    case "disc":
      return <td className="px-3 py-6 text-right font-semibold text-[#d4622a]">{row.disc}%</td>;
    case "net":
      return <td className="px-3 py-6 text-right text-[#555]">{inr(row.net)}</td>;
    case "total":
      return <td className="px-3 py-6 pr-10 text-right font-bold last:pr-10">{inr(row.total)}</td>;
  }
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
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
            <path d="M16 3v26M3 16h26" stroke="#d4622a" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <span className="text-3xl font-bold tracking-[0.06em] text-white">LEDLUM</span>
        </div>

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
  visibleCols: typeof COLS[number][];
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
                key={c.key}
                className={`${c.className} whitespace-nowrap px-3 py-4 text-[11.5px] font-medium uppercase tracking-[0.06em] text-white first:pl-10 last:pr-10`}
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
                <BoqCell key={c.key} colKey={c.key} row={r} />
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
  const visibleCols = getVisibleCols(rows);

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

export const SAMPLE_ROWS: BoqRow[] = [
  { slNo: 1, description: "Adjustable Downlight", type: "DL-1", code: "LLF-1013", watt: "12W", beam: "60°", cct: "3000K", auto: "ON-OFF", color: "Black Chrome", qty: 8, unit: "NO'S", mrp: 1690, disc: 40, net: 1014, total: 8112 },
  { slNo: 2, description: "Adjustable Wall Washer", type: "DL-2", code: "LLF-104", watt: "20W", beam: "24°", cct: "3000K", auto: "ON-OFF", color: "White", qty: 19, unit: "NO'S", mrp: 3800, disc: 40, net: 2280, total: 43320 },
  { slNo: 3, description: "Recessed Downlight", type: "DL-3", code: "LLF-1027", watt: "9W", beam: "50°", cct: "3000K", auto: "ON-OFF", color: "Matt Black", qty: 6, unit: "NO'S", mrp: 1790, disc: 40, net: 1074, total: 6444 },
  { slNo: 4, description: "Adjustable Downlight", type: "DL-4", code: "LLF-1010", watt: "9W", beam: "15°", cct: "3000K", auto: "ON-OFF", color: "Black Chrome", qty: 8, unit: "NO'S", mrp: 1520, disc: 40, net: 912, total: 7296 },
  { slNo: 5, description: "Recessed Wall Washer", type: "DL-5", code: "LLF-1022", watt: "12W", beam: "—", cct: "3000K", auto: "ON-OFF", color: "Black", qty: 11, unit: "NO'S", mrp: 2960, disc: 40, net: 1776, total: 19536 },
  { slNo: 6, description: "Trimless Downlight", type: "DL-6", code: "LLA-014+LLA-017A", watt: "8W", beam: "15°", cct: "3000K", auto: "ON-OFF", color: "Black", qty: 5, unit: "NO'S", mrp: 3150, disc: 40, net: 1890, total: 9450 },
  { slNo: 7, description: "Adjustable Downlight", type: "DL-7", code: "LLF-1013", watt: "12W", beam: "60°", cct: "3000K", auto: "ON-OFF", color: "Black Chrome", qty: 11, unit: "NO'S", mrp: 1690, disc: 40, net: 1014, total: 11154 },
  { slNo: 8, description: "Adjustable Downlight", type: "DL-8", code: "LLF-1013", watt: "12W", beam: "36°", cct: "3000K", auto: "ON-OFF", color: "Black Chrome", qty: 11, unit: "NO'S", mrp: 1690, disc: 40, net: 1014, total: 11154 },
  { slNo: 9, description: "Adjustable Downlight", type: "DL-9", code: "LLF-300C", watt: "12W", beam: "24°", cct: "3000K", auto: "ON-OFF", color: "Black", qty: 11, unit: "NO'S", mrp: 2470, disc: 40, net: 1482, total: 16302 },
  { slNo: 10, description: "Recessed Downlight", type: "DL-10", code: "LLF-1007", watt: "5W", beam: "15°", cct: "3000K", auto: "DT-6", color: "Black Chrome", qty: 8, unit: "NO'S", mrp: 4030, disc: 40, net: 2418, total: 19344 },
  { slNo: 17, description: "Linear Suspended Light", type: "PL-1", code: "LLT-041", watt: "36W", beam: "60°", cct: "3000K", auto: "ON-OFF", color: "Black", qty: 1, unit: "NO'S", mrp: 4000, disc: 40, net: 2400, total: 2400 },
  { slNo: 18, description: "Driver", type: "LLA-248", code: "—", watt: "100W", beam: "—", cct: "—", auto: "—", color: "Black", qty: 4, unit: "NO'S", mrp: 3300, disc: 40, net: 1980, total: 7920 },
  { slNo: 19, description: "Driver", type: "LLA-249", code: "—", watt: "200W", beam: "—", cct: "—", auto: "—", color: "Black", qty: 2, unit: "NO'S", mrp: 4150, disc: 40, net: 2490, total: 4980 },
  { slNo: 20, description: "Endcap", type: "LLA-239", code: "—", watt: "—", beam: "—", cct: "—", auto: "—", color: "Black", qty: 7, unit: "NO'S", mrp: 50, disc: 40, net: 30, total: 210 },
  { slNo: 21, description: "1M Track Cover", type: "LLA-235", code: "—", watt: "—", beam: "—", cct: "—", auto: "—", color: "Black", qty: 18, unit: "NO'S", mrp: 170, disc: 40, net: 102, total: 1836 },
];
