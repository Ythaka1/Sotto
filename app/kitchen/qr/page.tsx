import QRCode from 'qrcode';
import { AUBREY, AUBREY_ROOMS } from '@/lib/seed/aubrey';

/*
 * The QR sheet.
 *
 * A pilot is physically impossible without this. Every other piece of the
 * product assumes a guest has already scanned something, and until a GM can put
 * a code on a folio there is nothing to scan.
 *
 * Printable A4, one code per room, each labelled and sized for the corner of a
 * folio. Cut lines included, because the alternative is a GM guessing.
 *
 * Set ?base=https://your-deploy.vercel.app to print codes that point at the
 * deployed app rather than at localhost.
 */

export const metadata = { title: 'The Aubrey, QR sheet' };

/* 26mm is about as small as a phone camera reliably reads from a folio at arm's
   length, with the error correction below. */
const CODE_MM = 26;

export default async function QRSheet({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.base) ? sp.base[0] : sp.base;
  const base = (raw ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  const codes = await Promise.all(
    AUBREY_ROOMS.map(async (room) => ({
      room,
      url: `${base}/f/${AUBREY.slug}?r=${encodeURIComponent(room)}`,
      /* Level M survives a folio being folded, creased, and handled. */
      svg: await QRCode.toString(`${base}/f/${AUBREY.slug}?r=${encodeURIComponent(room)}`, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
      }),
    })),
  );

  return (
    <>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
        .sheet {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6mm;
        }
        .cell {
          border: 0.2mm dashed #C9C6C2;
          padding: 3mm;
          text-align: center;
          break-inside: avoid;
        }
        .cell svg { width: ${CODE_MM}mm; height: ${CODE_MM}mm; display: block; margin: 0 auto; }
      `}</style>

      <main className="mx-auto max-w-[210mm] px-6 py-10">
        <div className="no-print mb-8">
          <h1 className="t-question mb-3">The Aubrey, QR sheet</h1>
          <p className="t-body text-muted mb-2 max-w-[62ch]">
            One code per room, each encoding the guest flow with that room number
            attached. Print at A4, cut on the dashed lines, and stick one in the corner
            of each folio.
          </p>
          <p className="t-body text-muted max-w-[62ch]">
            Codes currently point at <span className="t-example">{base}</span>. Add
            ?base=https://your-deploy to print codes for the deployed app.
          </p>
        </div>

        <div className="sheet">
          {codes.map((c) => (
            <div key={c.room} className="cell">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: c.svg }} />
              <p className="t-label mt-2">Room {c.room}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
