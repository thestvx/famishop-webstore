"use client";

import React, { useEffect, useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export const AdminTopbar = ({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const displayName = user?.displayName || (loading ? "..." : user?.email ? "Admin" : "Admin");
  const email = user?.email || (loading ? "" : "");

  return (
    <header className="h-16 bg-white border-b border-black/10 flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100"
          aria-label="open menu"
        >
          <Menu size={20} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
          />
          <input
            type="search"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-[#F0F0F0] text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100"
          aria-label="notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-black/10">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
            {user?.email ? user.email[0].toUpperCase() : "A"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-xs text-black/50 leading-tight">{email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
