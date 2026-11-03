import Link from "next/link";
import {
  Zap,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Calculator,
  Sigma,
} from "lucide-react";

const items = [
  {
    href: "/notas",
    title: "Notas rápidas",
    desc: "Conceptos de examen y apuntes al vuelo",
    icon: Zap,
  },
  {
    href: "/clases",
    title: "Clases",
    desc: "Notas, PDFs, fotos y audios por materia",
    icon: GraduationCap,
  },
  {
    href: "/herramientas",
    title: "Herramientas",
    desc: "Calculadora, graficador, matrices, unidades y más",
    icon: Calculator,
  },
  {
    href: "/formulario",
    title: "Formulario",
    desc: "Fórmulas de cálculo, álgebra, física y circuitos",
    icon: Sigma,
  },
  {
    href: "/calendario",
    title: "Calendario",
    desc: "Exámenes, entregas y pendientes",
    icon: CalendarDays,
  },
  {
    href: "/libros",
    title: "Libros",
    desc: "Tus PDFs de libros en un solo lugar",
    icon: BookOpen,
  },
];

export default function HomeGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ href, title, desc, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:bg-[var(--surface-hover)] hover:shadow-lg hover:shadow-black/20"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--link)]">
            <Icon size={20} />
          </span>
          <h3 className="mt-4 font-medium">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
        </Link>
      ))}
    </div>
  );
}
