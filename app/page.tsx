import Link from 'next/link';

/*
 * The root is not a guest surface. A guest always arrives at /f/[property] from
 * a QR code on their folio and never sees this.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6">
      <h1 className="t-question mb-3">Sotto</h1>
      <p className="t-body text-muted mb-8">
        One quiet question before you go. Guests arrive from a QR code on the folio.
      </p>
      <Link href="/kitchen" className="t-body underline">
        Kitchen
      </Link>
    </main>
  );
}
