"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEventos, type Tipo } from "@/lib/useEventos";

const COLOR: Record<Tipo, string> = { examen: "#d97757", entrega: "#6a9bcc", pendiente: "#788c5d" };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Page() {
  const { eventos, ready, agregar, alternar, borrar } = useEventos();
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(iso(new Date()));
  const [tipo, setTipo] = useState<Tipo>("examen");

  if (!ready) return null;

  const hoy = iso(new Date());
  const offset = (mes.getDay() + 6) % 7; // semana inicia en lunes
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = Array.from({ length: offset + dias }, (_, i) => (i < offset ? null : new Date(mes.getFullYear(), mes.getMonth(), i - offset + 1)));
  const proximos = eventos.filter((e) => !e.hecho && e.fecha >= hoy);
  const dias_para = (f: string) => Math.round((new Date(f + "T00:00").getTime() - new Date(hoy + "T00:00").getTime()) / 86400000);

  const crear = () => { if (titulo.trim() && fecha) { agregar(titulo.trim(), fecha, tipo); setTitulo(""); } };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Inicio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Calendario</h1>

      <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crear()}
          placeholder="Ej. Examen de Cálculo II" className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none placeholder:text-[var(--muted)]" />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg bg-[var(--bg)] px-2 py-1.5 text-sm [color-scheme:dark]" />
        <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="rounded-lg bg-[var(--bg)] px-2 py-1.5 text-sm">
          <option value="examen">Examen</option><option value="entrega">Entrega</option><option value="pendiente">Pendiente</option>
        </select>
        <button onClick={crear} disabled={!titulo.trim()} className="rounded-lg bg-[var(--accent)] p-2 text-black disabled:opacity-30" aria-label="Agregar"><Plus size={18} /></button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-medium capitalize">{mes.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</h2>
        <div className="flex gap-1">
          <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="rounded-md p-1.5 text-[var(--muted)] hover:text-[var(--text)]" aria-label="Mes anterior"><ChevronLeft size={18} /></button>
          <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="rounded-md p-1.5 text-[var(--muted)] hover:text-[var(--text)]" aria-label="Mes siguiente"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => <div key={d}>{d}</div>)}
        {celdas.map((d, i) => {
          const evs = d ? eventos.filter((e) => e.fecha === iso(d)) : [];
          return (
            <button key={i} disabled={!d} onClick={() => d && setFecha(iso(d))}
              className={"flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-sm " + (d ? "bg-[var(--surface)] hover:bg-[var(--surface-hover)] " : "") + (d && iso(d) === hoy ? "ring-1 ring-[var(--accent)] " : "") + (d && iso(d) === fecha ? "text-[var(--accent)]" : "text-[var(--text)]")}>
              {d?.getDate()}
              <span className="flex gap-0.5">{evs.slice(0, 3).map((e) => <i key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR[e.tipo] }} />)}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-10 text-lg font-medium">Próximos</h2>
      <div className="mt-3 space-y-2">
        {proximos.length === 0 && <p className="text-[var(--muted)]">Nada pendiente. 🎉</p>}
        {proximos.map((e) => {
          const n = dias_para(e.fecha);
          return (
            <div key={e.id} className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <input type="checkbox" checked={e.hecho} onChange={() => alternar(e)} className="accent-[var(--accent)]" aria-label="Hecho" />
              <i className="h-2 w-2 rounded-full" style={{ background: COLOR[e.tipo] }} />
              <span className="min-w-0 flex-1 truncate">{e.titulo}</span>
              <span className="text-xs text-[var(--muted)]">{n === 0 ? "Hoy" : n === 1 ? "Mañana" : `en ${n} días`}</span>
              <button onClick={() => borrar(e.id)} className="text-[var(--muted)] opacity-0 transition hover:text-red-400 group-hover:opacity-100" aria-label="Borrar"><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
