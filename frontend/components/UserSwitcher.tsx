"use client";

import Image from "next/image";

import { useAuth } from "@/context/AuthContext";

/** The "selected current user dropdown" CLAUDE.md's mocked-auth design calls for. */
export default function UserSwitcher() {
  const { users, currentUser, setCurrentUserId, loading } = useAuth();

  if (loading || users.length === 0) {
    return <div className="h-9 w-16 shrink-0 rounded-full bg-neutral-100 sm:w-24" />;
  }

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 py-1 pl-1 pr-2 sm:gap-2 sm:pr-3">
      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-neutral-200 sm:h-7 sm:w-7">
        {currentUser?.avatar_url ? (
          <Image
            src={currentUser.avatar_url}
            alt={currentUser.name}
            fill
            sizes="28px"
            className="object-cover"
          />
        ) : null}
      </div>
      <select
        aria-label="Current user"
        value={currentUser?.id ?? ""}
        onChange={(e) => setCurrentUserId(Number(e.target.value))}
        className="max-w-[3.5rem] border-0 bg-transparent p-0 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-0 sm:max-w-[9rem]"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
}
