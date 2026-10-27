"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type Editor as TipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ImagenFlotante } from "./imagen";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import {
  ArrowLeft, Bold, Italic, Underline, Strikethrough, Heading1, Heading2, List, ListOrdered, ImagePlus, Sigma,
  ScanText, Braces, TableIcon, AlignLeft, AlignCenter, AlignRight, AArrowUp, AArrowDown, Calculator, Keyboard,
  Pi, TrendingUp, Network, ChevronsDownUp, LayoutTemplate, Pin, PinOff, X,
} from "lucide-react";
import "katex/dist/katex.min.css";
import "./editor.css";
import { FontSize } from "./fontSize";
import { Llave } from "./llaves";
import { Atajos, AYUDA_ATAJOS } from "./atajos";
import { Matematica } from "./matematicas";
import { Grafica } from "./grafica";
import { Diagrama, PLANTILLAS_DIAGRAMA } from "./diagrama";
import { Plegable } from "./plegable";
import { leerTexto } from "@/lib/ocr";
import { evaluar } from "@/lib/math";
import { FORMULAS } from "@/lib/formulas";
import { PLANTILLAS } from "@/lib/plantillas";
import { useNotas, type Nota } from "@/lib/useNotas";

type Props = { scope: string; notaId: string; backHref: string };
type Cambios = Partial<Pick<Nota, "titulo" | "contenido" | "etiquetas" | "fijada">>;
type Item = { n: number; nivel: number; texto: string; pos: number };

const SIMBOLOS: Record<string, string[]> = {
  Cálculo: ["√", "∛", "∜", "∫", "∬", "∮", "∂", "∇", "∑", "∏", "∞", "Δ", "′", "″", "→", "≈", "lim", "dx", "dy", "dt"],
  Álgebra: ["²", "³", "ⁿ", "₁", "₂", "ₙ", "±", "×", "÷", "≠", "≤", "≥", "≡", "∝", "½", "π", "θ", "α", "β", "γ", "λ", "μ", "σ", "φ", "ω", "Ω", "ε", "ρ", "τ", "°"],
  "Mate discretas": ["∈", "∉", "⊂", "⊆", "⊃", "⊇", "∪", "∩", "∅", "∀", "∃", "¬", "∧", "∨", "⇒", "⇔", "⊕", "ℕ", "ℤ", "ℚ", "ℝ", "ℂ", "∴", "∵"],
  Física: ["Ω", "µ", "°C", "Å", "ℏ", "→", "⊥", "∥", "∠", "ΣF", "ΔE", "ΔT", "⟨", "⟩", "ℓ", "ν", "ω"],
  Figuras: ["○", "●", "□", "■", "△", "▲", "◇", "★", "☆", "←", "→", "↑", "↓", "↔", "⇐", "⇒", "⇔", "↦", "✓", "✗"],
};
const GRUPOS = [...Object.keys(SIMBOLOS), "Fórmulas"];

const AYUDA_EXTRA: [string, string][] = [
  ["/", "Menú de bloques al inicio de una línea (↑ ↓ Enter, Esc cierra)"],
  ["$x^2$", "Fórmula LaTeX en línea · $$\\int x\\,dx$$ en bloque"],
];

/* ───────── Menú "/" ───────── */
type Accion = { label: string; desc: string; run: (e: TipTapEditor) => void };
const ins = (e: TipTapEditor, c: unknown) => e.chain().focus().insertContent(c as never).run();

const ACCIONES: Accion[] = [
  { label: "Título 1", desc: "Encabezado grande", run: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
  { label: "Título 2", desc: "Encabezado mediano", run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: "Título 3", desc: "Encabezado pequeño", run: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: "Lista", desc: "Con viñetas", run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Lista numerada", desc: "Pasos 1, 2, 3…", run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Tabla", desc: "3×3 con encabezado", run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: "Fórmula LaTeX", desc: "Fórmula en línea", run: (e) => ins(e, { type: "matematica", attrs: { latex: "", display: false } }) },
  { label: "Fórmula en bloque", desc: "Fórmula centrada", run: (e) => ins(e, { type: "matematica", attrs: { latex: "", display: true } }) },
  { label: "Gráfica de función", desc: "Grafica f(x) dentro de la nota", run: (e) => ins(e, { type: "grafica" }) },
  { label: "Mapa mental", desc: "Diagrama de ideas", run: (e) => ins(e, { type: "diagrama", attrs: { code: PLANTILLAS_DIAGRAMA["Mapa mental"] } }) },
  { label: "Diagrama de flujo", desc: "Procesos y decisiones", run: (e) => ins(e, { type: "diagrama", attrs: { code: PLANTILLAS_DIAGRAMA["Diagrama de flujo"] } }) },
  { label: "Diagrama de secuencia", desc: "Interacciones en el tiempo", run: (e) => ins(e, { type: "diagrama", attrs: { code: PLANTILLAS_DIAGRAMA["Secuencia"] } }) },
  { label: "Bloque plegable", desc: "Título + contenido que se oculta", run: (e) => ins(e, { type: "plegable", attrs: { abierto: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Título" }] }, { type: "paragraph" }] }) },
  { label: "Llave", desc: "Llave { } para agrupar", run: (e) => e.chain().focus().toggleLlave().run() },
  ...PLANTILLAS.map((p) => ({ label: "Plantilla: " + p.nombre, desc: p.desc, run: (e: TipTapEditor) => ins(e, p.html) })),
];
const quitar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const filtrar = (q: string) => ACCIONES.filter((a) => quitar(a.label + " " + a.desc).includes(quitar(q)));

function comprimir(file: File, max = 1000): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k;
      c.height = img.height * k;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

export default function NotaEditor({ scope, notaId, backHref }: Props) {
  const { notas, ready, actualizar } = useNotas(scope);
  const nota = notas.find((n) => n.id === notaId);

  if (!ready) return null;
  if (!nota) {
    return (
      <main className="p-10 text-[var(--muted)]">
        Nota no encontrada. <Link href={backHref} className="underline">Volver</Link>
      </main>
    );
  }
  return <Editor nota={nota} backHref={backHref} onChange={(c) => actualizar(notaId, c)} />;
}

function Editor({ nota, backHref, onChange }: { nota: Nota; backHref: string; onChange: (c: Cambios) => void }) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [etiquetas, setEtiquetas] = useState<string[]>(nota.etiquetas);
  const [fijada, setFijada] = useState(nota.fijada);
  const [nuevaTag, setNuevaTag] = useState("");
  const [panel, setPanel] = useState(false);
  const [ayuda, setAyuda] = useState(false);
  const [plantillas, setPlantillas] = useState(false);
  const [grupo, setGrupo] = useState("Cálculo");
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [indice, setIndice] = useState<Item[]>([]);
  const [slash, setSlashS] = useState<string | null>(null);
  const [idx, setIdxS] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<Cambios>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TipTapEditor | null>(null);
  const scopeCalc = useRef<Record<string, unknown>>({});
  const slashRef = useRef<string | null>(null);
  const idxRef = useRef(0);

  const setSlash = (v: string | null) => { if (v !== slashRef.current) setIdx(0); slashRef.current = v; setSlashS(v); };
  const setIdx = (n: number) => { idxRef.current = n; setIdxS(n); };

  // Acumula cambios para que título, contenido y etiquetas no se pisen entre sí
  const guardarConRetraso = (c: Cambios) => {
    pendiente.current = { ...pendiente.current, ...c };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { onChange(pendiente.current); pendiente.current = {}; }, 400);
  };

  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2200); };

  const leerIndice = (ed: TipTapEditor) => {
    const out: Item[] = [];
    ed.state.doc.descendants((n, pos) => {
      if (n.type.name === "heading" && n.textContent.trim()) out.push({ n: out.length, nivel: n.attrs.level as number, texto: n.textContent, pos });
    });
    setIndice(out);
  };

  const irA = (it: Item) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.chain().focus().setTextSelection(it.pos + 1).run();
    (ed.view.nodeDOM(it.pos) as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const elegir = (a: Accion) => {
    const ed = editorRef.current;
    if (!ed) return;
    const { $from } = ed.state.selection;
    ed.chain().focus().deleteRange({ from: $from.start(), to: $from.end() }).run();
    a.run(ed);
    setSlash(null);
  };

  // Ctrl+Enter: calcula la línea (o selección) y escribe el resultado
  const calcular = async () => {
    const ed = editorRef.current;
    if (!ed) return;
    const { from, to, empty, $from } = ed.state.selection;
    let texto = (empty ? $from.parent.textContent : ed.state.doc.textBetween(from, to, " ")).trim();
    if (!texto) return;
    const termina = texto.endsWith("=");
    if (termina) texto = texto.slice(0, -1);
    try {
      const res = await evaluar(texto, scopeCalc.current);
      ed.chain().focus().insertContentAt(empty ? $from.end() : to, termina ? ` ${res}` : ` = ${res}`).run();
    } catch {
      avisar("No pude calcular esa línea");
    }
  };

  const importarFoto = async (file: File) => {
    const ed = editorRef.current;
    if (!ed) return;
    setLeyendo(true);
    try {
      const texto = await leerTexto(file);
      if (!texto) return alert("No se detectó texto en la foto.");
      const html = texto.split(/\n+/).map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
      ed.chain().focus().insertContent(html).run();
    } catch {
      alert("No se pudo leer la foto.");
    } finally {
      setLeyendo(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Atajos,
      TextAlign.configure({ types: ["heading", "paragraph", "llaveLabel"] }),
      ImagenFlotante.configure({ HTMLAttributes: { class: "nota-img" } }),
      Placeholder.configure({ placeholder: "Escribe…  ·  «/» para insertar bloques  ·  Ctrl+Enter calcula la línea" }),
      Llave,
      Matematica,
      Grafica,
      Diagrama,
      Plegable,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: nota.contenido,
    immediatelyRender: false,
    onCreate: ({ editor }) => { editorRef.current = editor; leerIndice(editor); },
    onUpdate: ({ editor }) => {
      guardarConRetraso({ contenido: editor.getHTML() });
      leerIndice(editor);
      const { $from } = editor.state.selection;
      const t = $from.parent.textContent;
      if ($from.parent.type.name === "paragraph" && t.startsWith("/") && !t.includes(" ")) setSlash(t.slice(1));
      else if (slashRef.current !== null) setSlash(null);
    },
    editorProps: {
      handleKeyDown: (_v, e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); calcular(); return true; }
        const q = slashRef.current;
        if (q !== null) {
          const lista = filtrar(q);
          if (e.key === "ArrowDown" && lista.length) { e.preventDefault(); setIdx((idxRef.current + 1) % lista.length); return true; }
          if (e.key === "ArrowUp" && lista.length) { e.preventDefault(); setIdx((idxRef.current - 1 + lista.length) % lista.length); return true; }
          if (e.key === "Enter" && lista[idxRef.current]) { e.preventDefault(); elegir(lista[idxRef.current]); return true; }
          if (e.key === "Escape") { setSlash(null); return true; }
        }
        return false;
      },
    },
  });

  const subirImagen = async (file?: File) => {
    if (!file || !editor) return;
    const src = await comprimir(file);
    editor.chain().focus().setImage({ src }).run();
  };

  const cambiarTam = (e: TipTapEditor, delta: number) => {
    const actual = parseInt(e.getAttributes("textStyle").fontSize ?? "16", 10) || 16;
    const nuevo = Math.min(48, Math.max(10, actual + delta));
    e.chain().focus().setMark("textStyle", { fontSize: `${nuevo}px` }).run();
  };

  const cambiarTags = (t: string[]) => { setEtiquetas(t); guardarConRetraso({ etiquetas: t }); };
  const agregarTag = () => {
    const t = nuevaTag.trim().replace(/^#/, "").toLowerCase();
    if (t && !etiquetas.includes(t)) cambiarTags([...etiquetas, t]);
    setNuevaTag("");
  };

  const btn = (activo: boolean) =>
    `rounded-md p-2 transition ${activo ? "bg-[var(--surface-hover)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`;

  // onMouseDown + preventDefault evita que el editor pierda el foco
  const tool = (activo: boolean, fn: (e: TipTapEditor) => void, icon: React.ReactNode, label: string) => (
    <button key={label} type="button" aria-label={label} title={label} className={btn(activo)}
      onMouseDown={(e) => { e.preventDefault(); if (editor) fn(editor); }}>
      {icon}
    </button>
  );

  const tablaOps: [string, (e: TipTapEditor) => void][] = [
    ["+ Fila arriba", (e) => e.chain().focus().addRowBefore().run()],
    ["+ Fila abajo", (e) => e.chain().focus().addRowAfter().run()],
    ["+ Columna izq.", (e) => e.chain().focus().addColumnBefore().run()],
    ["+ Columna der.", (e) => e.chain().focus().addColumnAfter().run()],
    ["− Fila", (e) => e.chain().focus().deleteRow().run()],
    ["− Columna", (e) => e.chain().focus().deleteColumn().run()],
    ["Borrar tabla", (e) => e.chain().focus().deleteTable().run()],
  ];

  const sugerencias = slash !== null ? filtrar(slash) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Notas
      </Link>

      <input
        value={titulo}
        onChange={(e) => { setTitulo(e.target.value); guardarConRetraso({ titulo: e.target.value }); }}
        placeholder="Sin título"
        className="mt-6 w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-[var(--border)]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" title={fijada ? "Desfijar nota" : "Fijar nota"} aria-label="Fijar"
          onClick={() => { setFijada(!fijada); guardarConRetraso({ fijada: !fijada }); }}
          className={"rounded-md p-1.5 transition " + (fijada ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]")}>
          {fijada ? <Pin size={16} /> : <PinOff size={16} />}
        </button>
        {etiquetas.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--accent)]">
            #{t}
            <button type="button" aria-label={`Quitar ${t}`} onClick={() => cambiarTags(etiquetas.filter((x) => x !== t))} className="text-[var(--muted)] hover:text-red-400"><X size={12} /></button>
          </span>
        ))}
        <input value={nuevaTag} onChange={(e) => setNuevaTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); agregarTag(); } }}
          onBlur={agregarTag} placeholder="+ etiqueta (ej. examen, cálculo)"
          className="min-w-40 bg-transparent text-xs outline-none placeholder:text-[var(--muted)]" />
      </div>

      {editor && (
        <div className="sticky top-0 z-10 mt-4 bg-[var(--bg)] pb-2">
          <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
            {tool(editor.isActive("bold"), (e) => e.chain().focus().toggleBold().run(), <Bold size={16} />, "Negritas")}
            {tool(editor.isActive("italic"), (e) => e.chain().focus().toggleItalic().run(), <Italic size={16} />, "Cursiva")}
            {tool(editor.isActive("underline"), (e) => e.chain().focus().toggleUnderline().run(), <Underline size={16} />, "Subrayado")}
            {tool(editor.isActive("strike"), (e) => e.chain().focus().toggleStrike().run(), <Strikethrough size={16} />, "Tachado")}
            {tool(false, (e) => cambiarTam(e, -2), <AArrowDown size={16} />, "Reducir texto")}
            {tool(false, (e) => cambiarTam(e, 2), <AArrowUp size={16} />, "Aumentar texto")}
            {tool(editor.isActive({ textAlign: "left" }), (e) => e.chain().focus().setTextAlign("left").run(), <AlignLeft size={16} />, "Alinear a la izquierda")}
            {tool(editor.isActive({ textAlign: "center" }), (e) => e.chain().focus().setTextAlign("center").run(), <AlignCenter size={16} />, "Centrar")}
            {tool(editor.isActive({ textAlign: "right" }), (e) => e.chain().focus().setTextAlign("right").run(), <AlignRight size={16} />, "Alinear a la derecha")}
            {tool(editor.isActive("heading", { level: 1 }), (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={16} />, "Título 1")}
            {tool(editor.isActive("heading", { level: 2 }), (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={16} />, "Título 2")}
            {tool(editor.isActive("bulletList"), (e) => e.chain().focus().toggleBulletList().run(), <List size={16} />, "Lista")}
            {tool(editor.isActive("orderedList"), (e) => e.chain().focus().toggleOrderedList().run(), <ListOrdered size={16} />, "Lista numerada")}
            {tool(editor.isActive("table"), (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), <TableIcon size={16} />, "Tabla")}
            {tool(editor.isActive("llave"), (e) => e.chain().focus().toggleLlave().run(), <Braces size={16} />, "Llave")}
            <span className="mx-1 w-px self-stretch bg-[var(--border)]" />
            {tool(false, (e) => ins(e, { type: "matematica", attrs: { latex: "", display: false } }), <Pi size={16} />, "Fórmula LaTeX ($…$)")}
            {tool(false, (e) => ins(e, { type: "grafica" }), <TrendingUp size={16} />, "Gráfica de función")}
            {tool(false, (e) => ins(e, { type: "diagrama" }), <Network size={16} />, "Mapa mental / diagrama")}
            {tool(false, (e) => ins(e, { type: "plegable", attrs: { abierto: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Título" }] }, { type: "paragraph" }] }), <ChevronsDownUp size={16} />, "Bloque plegable")}
            {tool(plantillas, () => setPlantillas((p) => !p), <LayoutTemplate size={16} />, "Plantillas")}
            <span className="mx-1 w-px self-stretch bg-[var(--border)]" />
            {tool(false, () => calcular(), <Calculator size={16} />, "Calcular línea (Ctrl+Enter)")}
            {tool(panel, () => setPanel((p) => !p), <Sigma size={16} />, "Símbolos y fórmulas")}
            {tool(ayuda, () => setAyuda((p) => !p), <Keyboard size={16} />, "Atajos de teclado")}
            <button type="button" aria-label="Foto a texto" title="Foto a texto" className={btn(false)} disabled={leyendo} onClick={() => inputFoto.current?.click()}>
              <ScanText size={16} />
            </button>
            <button type="button" aria-label="Imagen" title="Insertar imagen" className={btn(false)}
              onMouseDown={(e) => { e.preventDefault(); fileInput.current?.click(); }}>
              <ImagePlus size={16} />
            </button>
            {leyendo && <span className="ml-2 self-center text-xs text-[var(--muted)]">Leyendo…</span>}
            {aviso && <span className="ml-2 self-center text-xs text-red-400">{aviso}</span>}
            <input ref={inputFoto} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importarFoto(f); e.target.value = ""; }} />
            <input ref={fileInput} type="file" accept="image/*" className="hidden"
              onChange={(e) => { subirImagen(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          {slash !== null && sugerencias.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--accent)] bg-[var(--surface)] p-1 shadow-xl">
              {sugerencias.map((a, i) => (
                <button key={a.label} type="button" onMouseDown={(e) => { e.preventDefault(); elegir(a); }}
                  className={"flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm " + (i === idx ? "bg-[var(--surface-hover)]" : "")}>
                  <span>{a.label}</span><span className="truncate text-xs text-[var(--muted)]">{a.desc}</span>
                </button>
              ))}
            </div>
          )}

          {plantillas && (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
              {PLANTILLAS.map((p) => (
                <button key={p.id} type="button"
                  onMouseDown={(e) => { e.preventDefault(); ins(editor, p.html); setPlantillas(false); }}
                  className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-[var(--surface-hover)]">
                  <span>{p.nombre}</span><span className="text-xs text-[var(--muted)]">{p.desc}</span>
                </button>
              ))}
            </div>
          )}

          {editor.isActive("table") && (
            <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm">
              {tablaOps.map(([label, fn]) => (
                <button key={label} type="button" onMouseDown={(ev) => { ev.preventDefault(); fn(editor); }}
                  className={`rounded-md px-2 py-1 hover:bg-[var(--surface-hover)] ${label === "Borrar tabla" ? "text-red-400" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {ayuda && (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
              {[...AYUDA_EXTRA, ...AYUDA_ATAJOS].map(([k, d]) => (
                <p key={k} className="flex gap-3 py-0.5"><code className="w-44 shrink-0 text-[var(--accent)]">{k}</code><span className="text-[var(--muted)]">{d}</span></p>
              ))}
              <p className="mt-2 text-xs text-[var(--muted)]">Tip: escribe <code>a = 3</code> y Ctrl+Enter; después <code>a*5 =</code> y Ctrl+Enter usa esa variable.</p>
            </div>
          )}

          {panel && (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap gap-1 text-sm">
                {GRUPOS.map((g) => (
                  <button key={g} type="button" onMouseDown={(e) => { e.preventDefault(); setGrupo(g); }}
                    className={`rounded-md px-2 py-1 ${g === grupo ? "bg-[var(--accent)] text-black" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
                    {g}
                  </button>
                ))}
              </div>
              {grupo === "Fórmulas" ? (
                <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
                  {FORMULAS.map((f) => (
                    <button key={f.nombre} type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(f.f).run(); }}
                      className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--surface-hover)]">
                      <span className="block text-xs text-[var(--muted)]">{f.cat} · {f.nombre}</span>
                      <span className="block truncate font-mono text-sm">{f.f}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-8 gap-1 sm:grid-cols-10">
                  {SIMBOLOS[grupo].map((s) => (
                    <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(s).run(); }}
                      className="rounded-md py-1.5 text-lg hover:bg-[var(--surface-hover)]">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {indice.length > 1 && (
        <aside className="fixed right-6 top-28 hidden max-h-[70vh] w-56 overflow-y-auto text-sm xl:block">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">Índice</p>
          {indice.map((it) => (
            <button key={it.n} type="button" onClick={() => irA(it)} style={{ paddingLeft: (it.nivel - 1) * 12 }}
              className="block w-full truncate py-0.5 text-left text-[var(--muted)] hover:text-[var(--accent)]">
              {it.texto}
            </button>
          ))}
        </aside>
      )}

      <div className="mt-6">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
