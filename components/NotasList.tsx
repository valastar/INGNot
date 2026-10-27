"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Pin, PinOff, Search } from "lucide-react";
import { useNotas } from "@/lib/useNotas";

type Props = { scope: string; base: string; backHref: string; backLabel: string; titulo: string };

const preview = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);

export default function NotasList({ scope, base, backHref, backLabel, titulo }: Props) {
  const router = useRouter();
  const { notas, ready, crear, borrar, actualizar } = useNotas(scope);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  if (!ready) return null;

  const etiquetas = Array.from(new Set(notas.flatMap((n) => n.etiquetas))).sort();
  const texto = q.trim().toLowerCase();
  const lista = notas
    .filter((n) => (!tag || n.etiquetas.includes(tag)) && (!texto || (n.titulo + " " + preview(n.contenido) + " " + n.etiquetas.join(" ")).toLowerCase().includes(texto)))
    .sort((a, b) => Number(b.fijada) - Number(a.fijada) || b.actualizada.localeCompare(a.actualizada));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
        <button
          onClick={async () => { const id = await crear(); if (id) router.push(`${base}/${id}`); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-black"
        >
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 focus-within:border-[var(--accent)]">
        <Search size={16} className="text-[var(--muted)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en título, texto y etiquetas…"
          className="w-full bg-transparent py-2.5 outline-none placeholder:text-[var(--muted)]" />
      </div>

      {etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {etiquetas.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? null : t)}
              className={"rounded-full px-2.5 py-1 text-xs " + (tag === t ? "bg-[var(--accent)] font-medium text-black" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]")}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <p className="mt-16 text-center text-[var(--muted)]">{notas.length === 0 ? "Aún no hay notas. Crea la primera." : "Sin resultados."}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {lista.map((n) => (
            <div key={n.id} className="group relative">
              <Link href={`${base}/${n.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 pr-20 transition hover:bg-[var(--surface-hover)]">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="flex min-w-0 items-center gap-1.5 truncate font-medium">
                    {n.fijada && <Pin size={13} className="shrink-0 text-[var(--accent)]" />}
                    <span className="truncate">{n.titulo || "Sin título"}</span>
                  </h3>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    {new Date(n.actualizada).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{preview(n.contenido) || "Nota vacía"}</p>
                {n.etiquetas.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs text-[var(--accent)]">{n.etiquetas.map((t) => <span key={t}>#{t}</span>)}</p>
                )}
              </Link>
              <div className="absolute right-3 top-3 flex opacity-0 transition group-hover:opacity-100">
                <button onClick={() => actualizar(n.id, { fijada: !n.fijada })} className="rounded-md p-1.5 text-[var(--muted)] hover:text-[var(--accent)]" aria-label={n.fijada ? "Desfijar" : "Fijar"}>
                  {n.fijada ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <button onClick={() => borrar(n.id)} className="rounded-md p-1.5 text-[var(--muted)] hover:text-red-400" aria-label="Borrar nota">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
