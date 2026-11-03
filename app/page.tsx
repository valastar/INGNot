"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEventos } from "@/lib/useEventos";
import { useClases } from "@/lib/useClases";
import { btn } from "@/components/tools/ui";

type Reciente = { id: string; titulo: string; clase_id: string | null; actualizada: string };

const COLOR = { examen: "#EF4444", entrega: "#38BDF8", pendiente: "#10B981" } as const;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diasPara = (f: string, hoy: string) =>
  Math.round((new Date(f + "T00:00").getTime() - new Date(hoy + "T00:00").getTime()) / 86400000);
const cuando = (n: number) => (n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`);
const lista = "divide-y divide-[var(--border)] border-y border-[var(--border)]";
const vacio = "border-y border-[var(--border)] py-4 text-sm text-[var(--muted)]";

function Seccion({ titulo, enlace, children }: { titulo: string; enlace?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{titulo}</h2>
        {enlace && <Link href={enlace.href} className="text-xs text-[var(--link)] hover:underline">{enlace.label}</Link>}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const { eventos, ready: okEv } = useEventos();
  const { clases, ready: okCl } = useClases();
  const [recientes, setRecientes] = useState<Reciente[] | null>(null);

  useEffect(() => {
    supabase
      .from("notas")
      .select("id,titulo,clase_id,actualizada")
      .order("actualizada", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecientes((data as Reciente[]) ?? []));
  }, []);

  const nueva = async () => {
    const { data } = await supabase.from("notas").insert({ clase_id: null }).select("id").single();
    if (data) router.push(`/notas/${data.id}`);
  };

  const hoy = iso(new Date());
  const proximos = eventos.filter((e) => !e.hecho && e.fecha >= hoy).slice(0, 6);
  const nombreClase = (id: string | null) => clases.find((c) => c.id === id)?.nombre ?? "Nota rápida";
  const hrefNota = (n: Reciente) => (n.clase_id ? `/clases/${n.clase_id}/notas/${n.id}` : `/notas/${n.id}`);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight first-letter:uppercase">
          {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <button onClick={nueva} className={btn}>Nueva nota</button>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <Seccion titulo="Próximos" enlace={{ href: "/calendario", label: "Calendario" }}>
          {okEv && (proximos.length === 0 ? (
            <p className={vacio}>Nada pendiente.</p>
          ) : (
            <ul className={lista}>
              {proximos.map((e) => {
                const n = diasPara(e.fecha, hoy);
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="h-4 w-0.5 shrink-0" style={{ background: COLOR[e.tipo] }} />
                    <span className="min-w-0 flex-1 truncate">{e.titulo}</span>
                    <span className={"shrink-0 text-xs " + (n <= 2 ? "text-[var(--link)]" : "text-[var(--muted)]")}>
                      {e.tipo} · {cuando(n)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
        </Seccion>

        <Seccion titulo="Notas recientes">
          {recientes && (recientes.length === 0 ? (
            <p className={vacio}>Aún no tienes notas.</p>
          ) : (
            <ul className={lista}>
              {recientes.map((n) => (
                <li key={n.id}>
                  <Link href={hrefNota(n)} className="flex items-baseline justify-between gap-3 py-2.5 text-sm hover:text-[var(--link)]">
                    <span className="min-w-0 truncate">{n.titulo || "Sin título"}</span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {okCl ? nombreClase(n.clase_id) : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </Seccion>

        <Seccion titulo="Clases" enlace={{ href: "/clases", label: "Administrar" }}>
          {okCl && (clases.length === 0 ? (
            <p className={vacio}>Crea tu primera clase en <Link href="/clases" className="text-[var(--link)] hover:underline">Clases</Link>.</p>
          ) : (
            <ul className={lista}>
              {clases.map((c) => (
                <li key={c.id}>
                  <Link href={`/clases/${c.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-[var(--link)]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                    <span className="truncate">{c.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </Seccion>
      </div>
    </main>
  );
}