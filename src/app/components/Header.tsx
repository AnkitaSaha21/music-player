"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function Header() {
  const router = useRouter();
  return (
    <header className="bg-black py-4 flex items-center justify-between border-b border-green-500 mb-6 shadow-md">
      <div className="flex items-center gap-3 px-6">
        <h1
          className="text-2xl font-extrabold text-green-400 tracking-wide cursor-pointer"
          onClick={() => router.push("/")}
        >
          Music<span className="text-white">Player</span>
        </h1>
      </div>
    </header>
  );
}
