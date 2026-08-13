import Image from "next/image";

import type { ListingPhotoOut } from "@/lib/types";

const THUMB_SLOTS = 4;

/**
 * Airbnb's classic 1-large + up-to-4-thumbnails grid. Degrades gracefully
 * for listings with fewer photos: unused thumbnail cells render as a plain
 * filler block instead of leaving a visual gap.
 */
export default function Gallery({ photos, title }: { photos: ListingPhotoOut[]; title: string }) {
  if (photos.length === 0) {
    return <div className="aspect-[2/1] rounded-2xl bg-neutral-100" />;
  }

  const [main, ...rest] = photos;
  const thumbs = rest.slice(0, THUMB_SLOTS);
  const hasThumbs = thumbs.length > 0;

  return (
    <div className="grid aspect-[2/1] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
      <div className={`relative ${hasThumbs ? "col-span-2 row-span-2" : "col-span-4 row-span-2"}`}>
        <Image
          src={main.url}
          alt={title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>

      {hasThumbs &&
        Array.from({ length: THUMB_SLOTS }, (_, i) => thumbs[i]).map((photo, i) =>
          photo ? (
            <div key={photo.id} className="relative col-span-1 row-span-1">
              <Image src={photo.url} alt={title} fill sizes="25vw" className="object-cover" />
            </div>
          ) : (
            <div key={`empty-${i}`} className="col-span-1 row-span-1 bg-neutral-100" />
          ),
        )}
    </div>
  );
}
