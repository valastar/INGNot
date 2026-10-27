"use client";
import { useEffect, useRef, useState } from "react";
import katex from "katex";
import type { MathfieldElement } from "mathlive";
import { Node, mergeAttributes, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { dibujarGrafica, COLORES } from "@/lib/graficar";
import { getMath, normalizar } from "@/lib/math";
import { latexAMath } from "@/lib/latexMath";
import { Flotante, atributosFlotante } from "./bloque";
import CampoMath from "./CampoMath";

const PALETA = ["#d97757", "#6a9bcc", "#788c5d", "#c586c0", "#d4a72c", "#4db6ac", "#e5484d", "#ffffff"];

const attr = <T,>(nombre: string, defecto: T, leer: (v: string) => T) => ({
  default: defecto,
  parseHTML: (el: HTMLElement) => { const v = el.getAttribute(`data-${nombre}`); return v === null ? defecto : leer(v); },
  renderHTML: (a: Record<string, unknown>) => ({ [`data-${nombre}`]: String(a[nombre]) }),
});

const campo = "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]";
const btnMini = "inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-2.5 py-1 text-sm text-[var(--muted)] hover:text-[var(--text)]";

const ICO_FRAC = katex.renderToString("\\frac{\\square}{\\square}", { throwOnError: false });
const ICO_POT = katex.renderToString("x^{\\square}", { throwOnError: false });

// Lee el LaTeX guardado de cada función (si la gráfica es antigua, usa el texto de la función)
const leerLatex = (raw: string, lista: string[]) => {
  let a: string[] = [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) a = p.map(String); } catch {}
  return lista.map((f, i) => a[i] ?? f);
};

function Vista(p: NodeViewProps) {
  const { node, updateAttributes, deleteNode } = p;
  const { fns, latexfns, colores, xmin, xmax, alto, ancho, lado } = node.attrs as {
    fns: string; latexfns: string; colores: string; xmin: number; xmax: number; alto: number; ancho: number; lado: string;
  };
  const canvas = useRef<HTMLCanvasElement>(null);
  const campos = useRef<(MathfieldElement | null)[]>([]);
  const [edit, setEdit] = useState(false);
  const [foco, setFoco] = useState(0);
  const [tex, setTex] = useState<string[]>([]);

  const lista = [...fns.split("|"), "", "", ""].slice(0, 3);
  const latexLista = leerLatex(latexfns, lista);
  const cols = COLORES.map((d, i) => colores.split("|")[i] || d);
  const [mostrar, setMostrar] = useState(Math.max(1, lista.reduce((n, f, i) => (f.trim() ? i + 1 : n), 0)));

  // Dibujar la gráfica
  useEffect(() => {
    if (canvas.current) dibujarGrafica(canvas.current, fns.split("|"), xmin, xmax, colores.split("|"));
  }, [fns, colores, xmin, xmax, edit, ancho, alto, lado]);

  // Vista bonita de cada función arriba de la gráfica
  useEffect(() => {
    let vivo = true;
    (async () => {
      const m = await getMath();
      const out = fns.split("|").map((f) => {
        if (!f.trim()) return "";
        try { return katex.renderToString(m.parse(normalizar(f)).toTex(), { throwOnError: false }); } catch { return ""; }
      });
      if (vivo) setTex(out);
    })();
    return () => { vivo = false; };
  }, [fns]);

  const cambiar = (i: number, latex: string) => {
    const nuevoLatex = [...latexLista]; nuevoLatex[i] = latex;
    updateAttributes({
      latexfns: JSON.stringify(nuevoLatex),
      fns: lista.map((f, j) => (j === i ? latexAMath(latex) : f)).join("|"),
    });
  };
  const setColor = (i: number, v: string) => updateAttributes({ colores: cols.map((c, j) => (j === i ? v : c)).join("|") });

  // Botones: insertan los cuadritos en el campo que estás editando
  const fraccion = () => { const m = campos.current[foco]; if (m) { m.focus(); m.insert("\\frac{#@}{#?}"); } };
  const elevar = () => { const m = campos.current[foco]; if (m) { m.focus(); m.executeCommand("moveToSuperscript"); } };

  return (
    <Flotante
      p={p}
      tarjeta
      conAlto
      extra={
        <>
          <button type="button" onClick={() => setEdit((v) => !v)} title="Editar funciones" className={"flot-btn" + (edit ? " activo" : "")}><Pencil size={14} /></button>
          <button type="button" onClick={() => deleteNode()} title="Borrar gráfica" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>
        </>
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {lista.map((f, i) => f.trim() && (
          <span key={i} className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: cols[i] }} />
            <span className="text-xs text-[var(--muted)]">f{i + 1}(x) =</span>
            {tex[i] ? <span dangerouslySetInnerHTML={{ __html: tex[i] }} /> : <span className="font-mono text-xs">{f}</span>}
          </span>
        ))}
      </div>

      <canvas ref={canvas} style={{ width: "100%", height: alto }} className="rounded-lg bg-[var(--bg)]" />

      {edit && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); fraccion(); }} className={btnMini}>
              <span dangerouslySetInnerHTML={{ __html: ICO_FRAC }} /> Fracción
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); elevar(); }} className={btnMini}>
              <span dangerouslySetInnerHTML={{ __html: ICO_POT }} /> Elevar
            </button>
            <span className="text-xs text-[var(--muted)]">
              Aplica a f{foco + 1}. Haz clic en un cuadrito o usa ← → ↑ ↓ para moverte y escribe el número.
            </span>
          </div>

          <div className="space-y-2">
            {lista.slice(0, mostrar).map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <input type="color" value={cols[i]} onChange={(e) => setColor(i, e.target.value)} title="Color de la gráfica"
                    className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0" />
                  <span className="shrink-0 text-xs text-[var(--muted)]">f{i + 1}(x) =</span>
                  <div className="min-w-0 flex-1">
                    <CampoMath
                      inicial={latexLista[i]}
                      onLatex={(l) => cambiar(i, l)}
                      onFoco={() => setFoco(i)}
                      reg={(el) => { campos.current[i] = el; }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pl-9">
                  {PALETA.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(i, c)} aria-label={`Color ${c}`}
                      className="h-4 w-4 rounded-full border border-[var(--border)]"
                      style={{ background: c, outline: cols[i].toLowerCase() === c ? "2px solid var(--text)" : "none", outlineOffset: 1 }} />
                  ))}
                </div>
              </div>
            ))}
            {mostrar < 3 && (
              <button type="button" onClick={() => setMostrar(mostrar + 1)} className={btnMini}><Plus size={12} /> Otra función</button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            x de <input type="number" value={xmin} onChange={(e) => updateAttributes({ xmin: Number(e.target.value) })} className={campo + " !w-24"} />
            a <input type="number" value={xmax} onChange={(e) => updateAttributes({ xmax: Number(e.target.value) })} className={campo + " !w-24"} />
          </div>
        </div>
      )}
    </Flotante>
  );
}

export const Grafica = Node.create({
  name: "grafica",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      fns: attr("fns", "x", (v) => v),                  // una sola gráfica por defecto: f(x) = x
      latexfns: attr("latexfns", "", (v) => v),         // lo que escribes en los campos (con fracciones y potencias)
      colores: attr("colores", COLORES.join("|"), (v) => v),
      xmin: attr("xmin", -10, Number),
      xmax: attr("xmax", 10, Number),
      alto: attr("alto", 260, Number),
      ...atributosFlotante,
    };
  },
  parseHTML() { return [{ tag: "div[data-grafica]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-grafica": "" })]; },
  addNodeView() { return ReactNodeViewRenderer(Vista); },
});