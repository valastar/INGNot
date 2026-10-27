"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { FORMULAS, CATEGORIAS } from "@/lib/formulas";

export default function Page() {
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const lista = FORMULAS.filter(
    (f) => (cat === "Todas" || f.cat === cat) && (f.nombre + f.f).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Inicio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Formulario</h1>
      <p className="mt-2 text-[var(--muted)]">Toca una fórmula para copiarla y pegarla en tus notas.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…"
        className="mt-6 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 outline-none focus:border-[var(--accent)]" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Todas", ...CATEGORIAS].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={"rounded-lg px-3 py-1.5 text-sm " + (c === cat ? "bg-[var(--accent)] font-medium text-black" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]")}>{c}</button>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {lista.map((f) => (
          <button key={f.nombre} onClick={() => { navigator.clipboard.writeText(f.f); setCopiado(f.nombre); setTimeout(() => setCopiado(null), 1200); }}
            className="flex w-full items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:bg-[var(--surface-hover)]">
            <div className="min-w-0">
              <p className="text-xs text-[var(--muted)]">{f.cat} · {f.nombre}</p>
              <p className="mt-1 break-words font-mono text-sm">{f.f}</p>
            </div>
            {copiado === f.nombre ? <Check size={16} className="mt-1 shrink-0 text-[var(--accent)]" /> : <Copy size={16} className="mt-1 shrink-0 text-[var(--muted)]" />}
          </button>
        ))}
        {lista.length === 0 && <p className="text-center text-[var(--muted)]">Sin resultados.</p>}
      </div>
    </main>
  );
}
