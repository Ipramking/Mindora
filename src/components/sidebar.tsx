"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarClock, UserCircle, Menu, X, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planner", label: "Planner", icon: CalendarClock },
  { href: "/dashboard/account", label: "Account", icon: UserCircle },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ email, pathname, onNavigate }: { email: string; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
        <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" />
        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-lg font-semibold text-transparent">
          Mindora
        </span>
      </Link>

      <div className="mt-6 flex-1">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="truncate px-3 text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          >
            <LogOut size={18} />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-lg font-semibold text-transparent">
            Mindora
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-64 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-lg font-semibold text-transparent">
                  Mindora
                </span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent email={email} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-zinc-200 p-4 md:flex md:flex-col dark:border-zinc-800">
        <SidebarContent email={email} pathname={pathname} />
      </aside>
    </>
  );
}
