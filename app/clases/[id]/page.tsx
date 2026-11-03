"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClases } from "@/lib/useClases";
import PageHeader from "@/app/components/PageHeader";

const carpetas = [
  { slug: "notas", titulo: "Notas", desc: "Apuntes de clase y tareas" },
  { slug: "pdfs", titulo: "PDFs", desc: "Libros, guías y presentaciones" },
  { slug: "fotos", titulo: "Fotos", desc: "Pizarrón y ejercicios" },
  { slug: "audios", titulo: "Audios", desc: "Grabaciones de clase" },
];

export default function ClasePage() {
  const { id } = useParams<{ id: string }>();
  const { clases, ready } = useClases();
  const clase = clases.find((c) => c.id === id);

  if (!ready) return null;
  if (!clase) {
    return (
      <main className="p-10 text-[var(--muted)]">
        Clase no encontrada. <Link href="/clases" className="text-[var(--link)] hover:underline">Volver</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        back={{ href: "/clases", label: "Clases" }}
        title={
          <span className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: clase.color }} />
            <span className="truncate">{clase.nombre}</span>
          </span>
        }
      />
      <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {carpetas.map((c) => (
          <li key={c.slug}>
            <Link href={`/clases/${id}/${c.slug}`} className="group flex items-baseline justify-between gap-4 py-4">
              <span className="font-medium group-hover:text-[var(--link)]">{c.titulo}</span>
              <span className="text-sm text-[var(--muted)]">{c.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}