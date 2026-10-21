"use client";

import { Bell, Search } from "lucide-react";

interface TopNavProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function TopNav({ title, breadcrumbs }: TopNavProps) {
  return (
    <header className="topnav">
      <div className="flex flex-col gap-0.5">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-neutral-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href}>{crumb.label}</a>
                ) : (
                  <span className="text-neutral-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-base font-bold text-neutral-900">{title}</h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search (decorative) */}
        <div className="hidden md:flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2 w-48">
          <Search className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-400">Cari...</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          id="notification-btn"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4 text-neutral-600" />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}
