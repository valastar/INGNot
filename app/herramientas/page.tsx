"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Calculadora from "@/components/tools/Calculadora";
import Graficador from "@/components/tools/Graficador";
import Matrices from "@/components/tools/Matrices";
import {
  Cuadratica,
  Unidades,
  Bases,
  Estadistica,
} from "@/components/tools/Mini";
import PageHeader from "@/app/components/PageHeader";

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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Herramientas"
        sub="Calculadora, graficador, matrices y más"
      />
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition " +
              (t.id === tab
                ? "border-[var(--accent)] text-[var(--text)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Activa />
      </div>
    </main>
  );
}
