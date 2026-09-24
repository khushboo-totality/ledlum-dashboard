// Ledlum — single-product data sheet (A4 portrait), captured to PDF by
// lib/exportBoqPdf.tsx. Images must already be pre-rendered data URLs sized
// to their boxes (see prepareImageForPdf) — html2canvas ignores object-fit,
// so any image that relies on it comes out stretched.

export type DatasheetSpec = { k: string; v: string };

export type DatasheetData = {
  title: string;
  code: string;
  category?: string;
  description?: string;
  heroImage?: string;
  gallery: string[];
  specs: DatasheetSpec[];
  date: string;
  preparedFor?: string;
  companyAddress: string;
  /** Prepared (cropped, white-on-dark) logo data URL. */
  logo?: string;
};

// Pixel boxes the images are pre-rendered at — exported so the exporter
// letterboxes each image to exactly the size it's shown at.
export const DATASHEET_HERO = { w: 330, h: 330 };
export const DATASHEET_THUMB = { w: 150, h: 150 };
export const DATASHEET_MAX_THUMBS = 4;

export default function ProductDatasheet({ data }: { data: DatasheetData }) {
  return (
    <div className="w-[794px] bg-white font-[Poppins,system-ui,sans-serif] text-[#1a1a1a] antialiased">
      <section className="flex min-h-[1123px] flex-col bg-white">
        <header className="flex items-center justify-between bg-[#12100f] px-10 py-7">
          {data.logo ? (
            <img src={data.logo} alt="LEDLUM" className="block h-12 w-auto" />
          ) : (
            <span className="text-2xl font-bold tracking-[0.06em] text-white">LEDLUM</span>
          )}
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">Product Data Sheet</div>
            <div className="mt-1 text-[12px] text-white/80">{data.date}</div>
          </div>
        </header>

        <div className="px-10 pt-8">
          {data.category && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">{data.category}</div>
          )}
          <h1 className="mt-1 text-[26px] font-bold uppercase leading-tight tracking-[0.02em]">{data.title}</h1>
          {data.title !== data.code && (
            <div className="mt-1 text-[13px] font-medium text-[#555]">Code: {data.code}</div>
          )}
        </div>

        <div className="flex gap-8 px-10 pt-6">
          <div className="shrink-0">
            <div
              className="flex items-center justify-center border border-black/[0.08] bg-white"
              style={{ width: DATASHEET_HERO.w, height: DATASHEET_HERO.h }}
            >
              {data.heroImage ? (
                <img src={data.heroImage} alt={data.code} width={DATASHEET_HERO.w} height={DATASHEET_HERO.h} className="block" />
              ) : (
                <span className="text-[11px] uppercase tracking-wide text-black/25">No image</span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">Specifications</div>
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                {data.specs.map((s, i) => (
                  <tr key={s.k} className={i % 2 ? "bg-white" : "bg-[#f7f7f5]"}>
                    <td className="w-[38%] px-3 py-[7px] align-top text-[#777]">{s.k}</td>
                    <td className="px-3 py-[7px] align-top font-semibold">{s.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.description && (
          <div className="px-10 pt-7">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">Description</div>
            <p className="text-[12.5px] leading-relaxed text-[#3d3a37]">{data.description}</p>
          </div>
        )}

        {data.gallery.length > 0 && (
          <div className="px-10 pt-7">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08d57]">Gallery</div>
            <div className="flex gap-4">
              {data.gallery.map((g, i) => (
                <div key={i} className="border border-black/[0.08]" style={{ width: DATASHEET_THUMB.w, height: DATASHEET_THUMB.h }}>
                  <img src={g} alt="" width={DATASHEET_THUMB.w} height={DATASHEET_THUMB.h} className="block" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {data.preparedFor && (
          <div className="px-10 pb-4 pt-8 text-[11px] text-[#777]">Prepared for: {data.preparedFor}</div>
        )}
        <footer className="bg-[#12100f] px-10 py-5">
          <span className="text-[11.5px] tracking-[0.02em] text-white/75">{data.companyAddress}</span>
        </footer>
      </section>
    </div>
  );
}
