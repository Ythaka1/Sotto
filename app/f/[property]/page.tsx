import { notFound } from 'next/navigation';
import { PROPERTIES } from '@/lib/seed/aubrey';
import { parseRoom } from '@/lib/room';
import { Flow } from './Flow';

/*
 * The guest route. A guest arrives here from a QR code on their folio, which
 * encodes /f/the-aubrey?r=14.
 */

export default async function GuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { property: slug } = await params;
  const property = PROPERTIES[slug];
  if (!property) notFound();

  const { r } = await searchParams;
  /* Absent or unparseable is not an error and never blocks the flow. */
  const room = parseRoom(r);

  return <Flow property={property} room={room} />;
}
