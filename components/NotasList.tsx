"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { useNotas } from "@/lib/useNotas";
import PageHeader from "@/app/components/PageHeader";
import { inp, btn } from "./tools/ui";

type Props = { scope: string; base: string; backHref: string; backLabel: string; titulo: string };

const preview = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 110);

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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title={titulo}
        sub={`${notas.length} ${notas.length === 1 ? "nota" : "notas"}`}
        back={{ href: backHref, label: backLabel }}
        action={
          <button onClick={async () => { const id = await crear(); if (id) router.push(`${base}/${id}`); }} className={btn}>
            Nueva nota
          </button>
        }
      />

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en título, texto y etiquetas" className={inp} />

      {etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {etiquetas.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? null : t)}
              className={"rounded px-2 py-0.5 text-xs " + (tag === t ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]")}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--muted)]">{notas.length === 0 ? "Aún no hay notas." : "Sin resultados."}</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {lista.map((n) => (
            <li key={n.id} className="group relative">
              <Link href={`${base}/${n.id}`} className="block py-3.5 pr-20">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium group-hover:text-[var(--link)]">
                    {n.fijada && <Pin size={12} className="shrink-0 text-[var(--link)]" />}
                    <span className="truncate">{n.titulo || "Sin título"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted)] group-hover:opacity-0">
                    {new Date(n.actualizada).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">{preview(n.contenido) || "Nota vacía"}</p>
                {n.etiquetas.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap gap-2 text-xs text-[var(--link)]">{n.etiquetas.map((t) => <span key={t}>#{t}</span>)}</p>
                )}
              </Link>
              <div className="absolute right-0 top-3 flex opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                <button onClick={() => actualizar(n.id, { fijada: !n.fijada })} className="p-1.5 text-[var(--muted)] hover:text-[var(--link)]" aria-label={n.fijada ? "Desfijar" : "Fijar"}>
                  {n.fijada ? <PinOff size={15} /> : <Pin size={15} />}
                </button>
                <button onClick={() => borrar(n.id)} className="p-1.5 text-[var(--muted)] hover:text-red-400" aria-label="Borrar nota">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}