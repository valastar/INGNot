"use client";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper, type NodeViewProps, type Editor } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, Maximize2, GripVertical } from "lucide-react";

export type Lado = "izq" | "centro" | "der";

// Atributos que comparten todos los bloques movibles
export const atributosFlotante = {
  lado: {
    default: "centro",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-lado") ?? "centro",
    renderHTML: (a: Record<string, unknown>) => ({ "data-lado": a.lado as string }),
  },
  ancho: {
    default: 100,
    parseHTML: (el: HTMLElement) => Number(el.getAttribute("data-ancho") ?? 100),
    renderHTML: (a: Record<string, unknown>) => ({ "data-ancho": String(a.ancho) }),
  },
};

const limitar = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

// Calcula dónde quedaría el bloque según la posición del mouse
function destino(ed: Editor, cx: number, cy: number) {
  const hit = ed.view.posAtCoords({ left: cx, top: cy });
  if (!hit) return null;
  const er = ed.view.dom.getBoundingClientRect();
  const rel = (cx - er.left) / er.width;
  const lado: Lado = rel < 0.4 ? "izq" : rel > 0.6 ? "der" : "centro";
  const $p = ed.state.doc.resolve(hit.pos);
  let antes: number, despues: number;
  if ($p.depth >= 1) { antes = $p.before(1); despues = $p.after(1); }
  else if (hit.inside >= 0) { antes = hit.inside; despues = hit.inside + (ed.state.doc.nodeAt(hit.inside)?.nodeSize ?? 0); }
  else return null;
  const dom = ed.view.nodeDOM(antes) as HTMLElement | null;
  if (!dom) return null;
  const r = dom.getBoundingClientRect();
  const arriba = cy < r.top + r.height / 2;
  return { lado, target: arriba ? antes : despues, lineY: arriba ? r.top : r.bottom };
}

type Guia = { x: number; y: number; lado: Lado; lineY: number; left: number; width: number };

type Props = {
  p: NodeViewProps;
  children: ReactNode;
  extra?: ReactNode;       // botones extra en la barra (editar, borrar…)
  conAlto?: boolean;       // si la esquina también cambia el alto (gráficas)
  tarjeta?: boolean;       // fondo y borde tipo tarjeta
};

export function Flotante({ p, children, extra, conAlto, tarjeta }: Props) {
  const { node, updateAttributes, editor, getPos } = p;
  const { lado, ancho, alto } = node.attrs as { lado: Lado; ancho: number; alto?: number };
  const ref = useRef<HTMLDivElement>(null);
  const [guia, setGuia] = useState<Guia | null>(null);
  const anchoMax = lado === "centro" ? 100 : 70; // al lado del texto, máximo 70% para que el texto siga legible

  const ponerLado = (l: Lado) => updateAttributes({ lado: l, ancho: l === "centro" ? ancho : Math.min(ancho, 70) });
  const ponerAncho = (a: number) => updateAttributes({ ancho: Math.min(a, anchoMax) });

  // ── Redimensionar con la esquina ──
  const redimensionar = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const cont = ref.current?.closest(".tiptap") as HTMLElement | null;
    if (!cont) return;
    const W = cont.clientWidth, x0 = e.clientX, y0 = e.clientY, a0 = ancho, h0 = alto ?? 0;
    const signo = lado === "der" ? -1 : 1, k = lado === "centro" ? 2 : 1;
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      const a = limitar(a0 + ((signo * k * (ev.clientX - x0)) / W) * 100, 15, anchoMax);
      updateAttributes({ ancho: Math.round(a), ...(conAlto ? { alto: Math.round(limitar(h0 + ev.clientY - y0, 120, 800)) } : {}) });
    };
    const soltar = () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  // ── Arrastrar a otra posición (izquierda / centro / derecha) ──
  const arrastrar = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX, y0 = e.clientY;
    let movido = false;
    const er = editor.view.dom.getBoundingClientRect();
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      if (!movido && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
      movido = true;
      const d = destino(editor, ev.clientX, ev.clientY);
      setGuia(d ? { x: ev.clientX, y: ev.clientY, lado: d.lado, lineY: d.lineY, left: er.left, width: er.width } : null);
    };
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      document.body.style.userSelect = "";
      setGuia(null);
      if (!movido) return;
      const d = destino(editor, ev.clientX, ev.clientY);
      const from = getPos();
      if (!d || typeof from !== "number") return;
      const actual = editor.state.doc.nodeAt(from);
      if (!actual) return;
      const attrs = { ...actual.attrs, lado: d.lado, ancho: d.lado === "centro" ? actual.attrs.ancho : Math.min(actual.attrs.ancho, 70) };
      const tr = editor.state.tr;
      if (d.target >= from && d.target <= from + actual.nodeSize) tr.setNodeMarkup(from, undefined, attrs);
      else {
        tr.delete(from, from + actual.nodeSize);
        tr.insert(tr.mapping.map(d.target), actual.type.create(attrs, actual.content, actual.marks));
      }
      editor.view.dispatch(tr);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  const b = (activo: boolean) => "flot-btn" + (activo ? " activo" : "");

  return (
    <NodeViewWrapper className={`flot flot-${lado}${tarjeta ? " bloque-nodo" : ""}`} style={{ width: `${ancho}%` }}>
      <div ref={ref}>
        <div className="flot-barra" contentEditable={false}>
          <button type="button" onPointerDown={arrastrar} title="Arrastra: suelta a la izquierda, centro o derecha" className="flot-btn cursor-grab"><GripVertical size={14} /></button>
          <button type="button" onClick={() => ponerLado("izq")} title="Izquierda (texto alrededor)" className={b(lado === "izq")}><AlignLeft size={14} /></button>
          <button type="button" onClick={() => ponerLado("centro")} title="Centro" className={b(lado === "centro" && ancho < 100)}><AlignCenter size={14} /></button>
          <button type="button" onClick={() => ponerLado("der")} title="Derecha (texto alrededor)" className={b(lado === "der")}><AlignRight size={14} /></button>
          <button type="button" onClick={() => updateAttributes({ lado: "centro", ancho: 100 })} title="Ancho completo" className={b(lado === "centro" && ancho === 100)}><Maximize2 size={14} /></button>
          <span className="flot-sep" />
          {[["S", 33], ["M", 50], ["L", 75]].map(([t, a]) => (
            <button key={t} type="button" onClick={() => ponerAncho(a as number)} className="flot-btn text-xs font-medium">{t}</button>
          ))}
          {extra && <span className="flot-sep" />}
          {extra}
        </div>
        {children}
        <span className={`flot-resize ${lado === "der" ? "der" : "izq"}`} onPointerDown={redimensionar} contentEditable={false} />
      </div>

      {guia && createPortal(
        <>
          <div style={{ position: "fixed", left: guia.left, width: guia.width, top: guia.lineY - 1, height: 2, background: "var(--accent)", zIndex: 50, pointerEvents: "none" }} />
          <div style={{ position: "fixed", left: guia.x + 12, top: guia.y + 12, zIndex: 50, pointerEvents: "none" }}
            className="rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-medium text-black">
            {guia.lado === "izq" ? "◧ Izquierda" : guia.lado === "der" ? "Derecha ◨" : "Centro"}
          </div>
        </>,
        document.body,
      )}
    </NodeViewWrapper>
  );
}