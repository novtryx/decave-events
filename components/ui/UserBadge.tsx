import { logout } from "@/app/actions/auth"; // 👈 adjust path
import { getMe } from "@/app/actions/settings";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MdLogout } from "react-icons/md";

export function UserBadge() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });

  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setMenuOpen((p) => !p)}
        className="flex items-center gap-2.5 hover:opacity-80 transition"
      >
        <div className="w-8 h-8 rounded-full bg-[#FFD159] text-black flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col leading-tight text-left">
          <span className="text-white text-sm font-medium truncate max-w-[120px]">
            {user?.name ?? "Loading..."}
          </span>
          <span className="text-gray-500 text-xs truncate max-w-[120px]">
            {user?.businessName ?? ""}
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-11 z-50 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-[#2a2a2a]">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>

            {/* Logout */}
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <MdLogout size={16} />
                Log out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}