"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

import type { ListingBookedRange } from "@/lib/types";

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export type DateRange = { checkIn: Date | null; checkOut: Date | null };

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DateRangePicker({
  bookedRanges,
  value,
  onChange,
}: {
  bookedRanges: ListingBookedRange[];
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value.checkIn ?? new Date()));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Checkout day itself isn't blocked — matches the backend's overlap rule
  // (`check_in < new.check_out AND check_out > new.check_in`), so same-day
  // turnover is allowed both here and when a booking would actually submit.
  const disabledIntervals = useMemo(
    () =>
      bookedRanges
        .filter((r) => r.status === "confirmed")
        .map((r) => ({
          start: startOfDay(parseISO(r.check_in)),
          end: startOfDay(parseISO(r.check_out)),
        })),
    [bookedRanges],
  );

  function isDisabled(day: Date) {
    if (isBefore(day, today)) return true;
    return disabledIntervals.some((r) => day >= r.start && day < r.end);
  }

  function isRangeClear(start: Date, end: Date) {
    const interior = eachDayOfInterval({ start, end }).slice(1, -1);
    return interior.every((d) => !isDisabled(d));
  }

  function handleSelect(day: Date) {
    if (isDisabled(day)) return;

    const startingFresh = !value.checkIn || (value.checkIn && value.checkOut);
    if (startingFresh) {
      onChange({ checkIn: day, checkOut: null });
      return;
    }

    const checkIn = value.checkIn as Date;
    if (isBefore(day, checkIn) || isSameDay(day, checkIn)) {
      onChange({ checkIn: day, checkOut: null });
      return;
    }

    if (!isRangeClear(checkIn, day)) {
      // A booked date sits inside the desired range — restart from here.
      onChange({ checkIn: day, checkOut: null });
      return;
    }

    onChange({ checkIn, checkOut: day });
  }

  const { days, leadingBlanks } = useMemo(() => {
    const start = startOfMonth(visibleMonth);
    const end = endOfMonth(visibleMonth);
    return { days: eachDayOfInterval({ start, end }), leadingBlanks: getDay(start) };
  }, [visibleMonth]);

  const previewEnd = value.checkIn && !value.checkOut ? hoverDate : value.checkOut;
  const rangeStart = value.checkIn && previewEnd && isBefore(previewEnd, value.checkIn) ? previewEnd : value.checkIn;
  const rangeEnd = value.checkIn && previewEnd && isBefore(previewEnd, value.checkIn) ? value.checkIn : previewEnd;

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-900">{format(visibleMonth, "MMMM yyyy")}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-neutral-500">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const disabled = isDisabled(day);
          const isCheckIn = value.checkIn && isSameDay(day, value.checkIn);
          const isCheckOut = value.checkOut && isSameDay(day, value.checkOut);
          const inRange = rangeStart && rangeEnd && day > rangeStart && day < rangeEnd;

          // Mutually-exclusive shape/color per state — never combine
          // `rounded-full` and `rounded-none` in one class list, since
          // Tailwind's cascade order (not JSX order) would decide the winner.
          let stateClass: string;
          if (isCheckIn || isCheckOut) {
            stateClass = "rounded-full bg-neutral-900 text-white";
          } else if (disabled) {
            stateClass = "rounded-full cursor-not-allowed text-neutral-300 line-through";
          } else if (inRange) {
            stateClass = "bg-neutral-100";
          } else {
            stateClass = "rounded-full hover:bg-neutral-100";
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              aria-pressed={Boolean(isCheckIn || isCheckOut)}
              aria-label={format(day, "PPP")}
              onClick={() => handleSelect(day)}
              onMouseEnter={() => !disabled && setHoverDate(day)}
              className={`mx-auto flex h-9 w-9 items-center justify-center text-sm ${stateClass}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
