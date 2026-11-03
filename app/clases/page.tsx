"use client";
import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useClases } from "@/lib/useClases";
import PageHeader from "@/app/components/PageHeader";
import { inp, btn } from "@/components/tools/ui";

export default function ClasesPage() {
  const { clases, ready, agregar, borrar } = useClases();
  const [nombre, setNombre] = useState("");

  const crear = () => {
    if (!nombre.trim()) return;
    agregar(nombre);
    setNombre("");
  };

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title="Clases" sub={`${clases.length} ${clases.length === 1 ? "materia" : "materias"}`} />

      <div className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          placeholder="Nueva clase, ej. Cálculo Diferencial"
          className={inp}
        />
        <button onClick={crear} disabled={!nombre.trim()} className={btn + " shrink-0"}>Añadir</button>
      </div>

      {clases.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--muted)]">Todavía no hay clases.</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {clases.map((c) => (
            <li key={c.id} className="group flex items-center">
              <Link href={`/clases/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 hover:text-[var(--link)]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                <span className="truncate">{c.nombre}</span>
              </Link>
              <button
                onClick={() => borrar(c.id)}
                aria-label="Borrar clase"
                className="p-2 text-[var(--muted)] opacity-0 transition hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}