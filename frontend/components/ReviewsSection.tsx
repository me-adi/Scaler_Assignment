import { format, parseISO } from "date-fns";
import Image from "next/image";

import type { ReviewOut } from "@/lib/types";

import { StarIcon } from "./icons";

export default function ReviewsSection({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ReviewOut[];
  rating: number | null;
  reviewCount: number;
}) {
  return (
    <section className="mt-12 border-t border-neutral-200 pt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
        <StarIcon className="h-5 w-5" />
        {rating != null ? rating.toFixed(1) : "New"} · {reviewCount} review
        {reviewCount === 1 ? "" : "s"}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No reviews yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="flex gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                {review.guest.avatar_url ? (
                  <Image
                    src={review.guest.avatar_url}
                    alt={review.guest.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{review.guest.name}</p>
                <p className="text-xs text-neutral-500">
                  {format(parseISO(review.created_at), "MMMM yyyy")}
                </p>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-3 w-3 ${i < review.rating ? "text-neutral-900" : "text-neutral-200"}`}
                    />
                  ))}
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-neutral-700">{review.comment}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
