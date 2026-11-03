"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, Calculator, CalendarDays, ChevronRight, House, LogOut, Plus, Sigma, SquarePen, Zap,
} from "lucide-react";
import { useUser } from "@/app/lib/useUser";
import { useClases } from "@/lib/useClases";
import { supabase } from "@/lib/supabase";
import NameGate from "@/app/components/NameGate";

const NAV = [
  { href: "/", label: "Inicio", Icon: House },
  { href: "/notas", label: "Notas rápidas", Icon: Zap },
  { href: "/calendario", label: "Calendario", Icon: CalendarDays },
  { href: "/herramientas", label: "Herramientas", Icon: Calculator },
  { href: "/formulario", label: "Formulario", Icon: Sigma },
  { href: "/libros", label: "Libros", Icon: BookOpen },
];
const CARPETAS = [["notas", "Notas"], ["pdfs", "PDFs"], ["fotos", "Fotos"], ["audios", "Audios"]];

const fila = "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors";
const on = "bg-[var(--surface)] text-[var(--text)]";
const off = "text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--text)]";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { name, ready, login, logout } = useUser();
  const { clases } = useClases();
  const path = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(true);

  if (!ready) return null;
  if (!name) return <NameGate onLogin={login} />;

  const activo = (h: string) => (h === "/" ? path === "/" : path === h || path.startsWith(h + "/"));
  const claseActual = /^\/clases\/([^/]+)/.exec(path)?.[1] ?? null;

  const nueva = async () => {
    const { data } = await supabase.from("notas").insert({ clase_id: claseActual }).select("id").single();
    if (data) router.push(claseActual ? `/clases/${claseActual}/notas/${data.id}` : `/notas/${data.id}`);
  };

  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--bg)] md:flex">
        {/* Marca */}
        <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] text-[11px] font-semibold text-white">MN</span>
          <span className="text-sm font-medium">My Note</span>
        </div>

        {/* Acción principal */}
        <div className="px-3 pt-2">
          <button
            onClick={nueva}
            className="flex w-full items-center gap-2.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
          >
            <SquarePen size={15} className="text-[var(--muted)]" /> Nueva nota
          </button>
        </div>

        {/* Navegación (con scroll propio) */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className={`${fila} ${activo(href) ? on : off}`}>
                  <Icon size={16} className={activo(href) ? "text-[var(--link)]" : ""} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between px-2.5">
            <button
              onClick={() => setAbierto(!abierto)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              <ChevronRight size={12} className={"transition-transform " + (abierto ? "rotate-90" : "")} /> Clases
            </button>
            <Link
              href="/clases"
              title="Administrar clases"
              aria-label="Administrar clases"
              className="rounded p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >
              <Plus size={14} />
            </Link>
          </div>

          {abierto && (
            <ul className="mt-1 space-y-0.5">
              {clases.length === 0 && <li className="px-2.5 py-1 text-xs text-[var(--muted)]">Sin clases todavía</li>}
              {clases.map((c) => {
                const base = `/clases/${c.id}`;
                const dentro = claseActual === c.id;
                return (
                  <li key={c.id}>
                    <Link
                      href={base}
                      className={`${fila} ${path === base ? on : dentro ? "text-[var(--text)] hover:bg-[var(--surface)]/60" : off}`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: c.color }} />
                      <span className="truncate">{c.nombre}</span>
                    </Link>
                    {dentro && (
                      <ul className="ml-[15px] mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                        {CARPETAS.map(([slug, label]) => {
                          const h = `${base}/${slug}`;
                          return (
                            <li key={slug}>
                              <Link href={h} className={`${fila} py-1 ${path.startsWith(h) ? on : off}`}>{label}</Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Perfil, separado de la navegación */}
        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-hover)] text-xs font-medium">
              {name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
            <button
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Móvil */}
      <nav className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg)] px-2 py-2 md:hidden">
        {[...NAV.slice(0, 3), { href: "/clases", label: "Clases", Icon: House }, ...NAV.slice(3)].map(({ href, label }) => (
          <Link key={href} href={href} className={`${fila} whitespace-nowrap ${activo(href) ? on : off}`}>{label}</Link>
        ))}
      </nav>

      {children}
    </div>
  );
}