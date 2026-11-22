"use client";

import React from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-black/60">{error?.message || "Unexpected error"}</p>
      <button onClick={() => reset()} className="rounded-full bg-black text-white px-5 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
