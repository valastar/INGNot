import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({
  title, sub, back, action,
}: { title: ReactNode; sub?: string; back?: { href: string; label: string }; action?: ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-[var(--muted)]">{sub}</p>}
      </div>
      {action}
    </header>
  );
}