"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Calculadora from "@/components/tools/Calculadora";
import Graficador from "@/components/tools/Graficador";
import Matrices from "@/components/tools/Matrices";
import { Cuadratica, Unidades, Bases, Estadistica } from "@/components/tools/Mini";

const TABS = [
  { id: "calc", label: "Calculadora", C: Calculadora },
  { id: "graf", label: "Graficador", C: Graficador },
  { id: "mat", label: "Matrices", C: Matrices },
  { id: "cuad", label: "Cuadrática", C: Cuadratica },
  { id: "uni", label: "Unidades", C: Unidades },
  { id: "base", label: "Bases", C: Bases },
  { id: "est", label: "Estadística", C: Estadistica },
];

export default function Page() {
  const [tab, setTab] = useState("calc");
  const Activa = TABS.find((t) => t.id === tab)!.C;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Inicio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Herramientas</h1>
      <p className="mt-2 text-[var(--muted)]">Todo lo que necesitas para resolver tareas de ingeniería.</p>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"rounded-lg px-3 py-1.5 text-sm transition " + (t.id === tab ? "bg-[var(--accent)] font-medium text-black" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6"><Activa /></div>
    </main>
  );
}
