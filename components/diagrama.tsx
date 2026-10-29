"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Node, mergeAttributes, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Flotante, atributosFlotante } from "./bloque";

/* ───────── Tipos y datos ───────── */
type N = { id: string; x: number; y: number; text: string; color: string };
type E = { id: string; from: string; to: string };
type D = { nodes: N[]; edges: E[] };
type Sel = { t: "n" | "e"; id: string } | null;

const COLORES = ["#d97757", "#6a9bcc", "#788c5d", "#c586c0", "#d4a72c", "#4db6ac", "#e5484d", "#9a958c"];
const H = 44;
const anc = (t: string) => Math.min(260, Math.max(110, Math.round(t.length * 8.5 + 36)));
const uid = () => Math.random().toString(36).slice(2, 9);
const json = (nodes: N[], edges: [string, string][]): string =>
  JSON.stringify({ nodes, edges: edges.map(([from, to]) => ({ id: uid(), from, to })) });

// Plantillas (formato visual). Úsalas en el menú "/" con attrs: { data: PLANTILLAS_DIAGRAMA["Mapa mental"] }
export const PLANTILLAS_DIAGRAMA: Record<string, string> = {
  "Mapa mental": json(
    [
      { id: "r", x: 250, y: 130, text: "Tema", color: COLORES[0] },
      { id: "a", x: 480, y: 30, text: "Idea 1", color: COLORES[1] },
      { id: "b", x: 480, y: 130, text: "Idea 2", color: COLORES[2] },
      { id: "c", x: 480, y: 230, text: "Idea 3", color: COLORES[3] },
    ],
    [["r", "a"], ["r", "b"], ["r", "c"]],
  ),
  "Diagrama de flujo": json(
    [
      { id: "i", x: 240, y: 10, text: "Inicio", color: COLORES[2] },
      { id: "q", x: 240, y: 90, text: "¿Condición?", color: COLORES[4] },
      { id: "s", x: 100, y: 180, text: "Acción 1", color: COLORES[1] },
      { id: "n", x: 380, y: 180, text: "Acción 2", color: COLORES[1] },
      { id: "f", x: 240, y: 270, text: "Fin", color: COLORES[0] },
    ],
    [["i", "q"], ["q", "s"], ["q", "n"], ["s", "f"], ["n", "f"]],
  ),
  Vacío: json([{ id: "r", x: 40, y: 40, text: "Idea", color: COLORES[0] }], []),
};

// Diagramas antiguos (Mermaid) siguen visibles; esto solo es por si quieres conservar la plantilla de secuencia.
export const PLANTILLAS_MERMAID: Record<string, string> = {
  Secuencia: `sequenceDiagram
  Alumno->>Profesor: Pregunta
  Profesor-->>Alumno: Respuesta`,
};

const leer = (raw: string): D => {
  try {
    const p = JSON.parse(raw || PLANTILLAS_DIAGRAMA["Vacío"]);
    if (Array.isArray(p.nodes) && Array.isArray(p.edges)) return p as D;
  } catch {}
  return JSON.parse(PLANTILLAS_DIAGRAMA["Vacío"]) as D;
};

// Punto donde la línea de un bloque hacia (tx,ty) toca su borde
const borde = (n: N, tx: number, ty: number) => {
  const w = anc(n.text);
  const cx = n.x + w / 2, cy = n.y + H / 2;
  const dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const k = Math.min(dx ? w / 2 / Math.abs(dx) : Infinity, dy ? H / 2 / Math.abs(dy) : Infinity);
  return { x: cx + dx * k, y: cy + dy * k };
};
const centro = (n: N) => ({ x: n.x + anc(n.text) / 2, y: n.y + H / 2 });

const btnMini = "inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 text-sm text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-40";

/* ───────── Editor visual ───────── */
function Editor(p: NodeViewProps) {
  const { node, updateAttributes, deleteNode } = p;
  const raw = node.attrs.data as string;
  const marcador = useId().replace(/:/g, "");

  const [d, setD] = useState<D>(() => leer(raw));
  const dRef = useRef(d);
  const [sel, setSelS] = useState<Sel>(null);
  const selRef = useRef<Sel>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [link, setLink] = useState<{ x: number; y: number; from: string; sobre: string | null } | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cancelar = useRef(false);

  const setSel = (s: Sel) => { selRef.current = s; setSelS(s); };
  const preview = (nd: D) => { dRef.current = nd; setD(nd); };
  const commit = (nd: D) => { preview(nd); updateAttributes({ data: JSON.stringify(nd) }); };

  // Si el contenido cambia desde fuera (deshacer/rehacer), sincroniza
  useEffect(() => {
    const n = leer(raw);
    if (JSON.stringify(n) !== JSON.stringify(dRef.current)) { dRef.current = n; setD(n); }
  }, [raw]);

  const pt = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const nodoEn = (x: number, y: number) =>
    dRef.current.nodes.find((n) => x >= n.x && x <= n.x + anc(n.text) && y >= n.y && y <= n.y + H);

  /* ── Acciones ── */
  const agregar = () => {
    const cur = dRef.current;
    const s = selRef.current;
    const base = s?.t === "n" ? cur.nodes.find((m) => m.id === s.id) : undefined;
    const W = svg.current?.clientWidth ?? 600;
    let x: number, y: number;
    if (base) {
      const hijos = cur.edges.filter((e) => e.from === base.id).length;
      x = base.x + anc(base.text) + 70;
      y = base.y + hijos * 60;
    } else {
      x = 30 + Math.floor(cur.nodes.length / 5) * 170;
      y = 20 + (cur.nodes.length % 5) * 60;
    }
    x = Math.max(0, Math.min(x, W - 140));
    const nn: N = { id: uid(), x, y, text: "Idea", color: base?.color ?? COLORES[cur.nodes.length % 6] };
    commit({
      nodes: [...cur.nodes, nn],
      edges: base ? [...cur.edges, { id: uid(), from: base.id, to: nn.id }] : cur.edges,
    });
    setSel({ t: "n", id: nn.id });
    setEditando(nn.id);
  };

  const borrar = () => {
    const s = selRef.current;
    if (!s) return;
    const cur = dRef.current;
    commit(
      s.t === "n"
        ? { nodes: cur.nodes.filter((n) => n.id !== s.id), edges: cur.edges.filter((e) => e.from !== s.id && e.to !== s.id) }
        : { ...cur, edges: cur.edges.filter((e) => e.id !== s.id) },
    );
    setSel(null);
  };
  const borrarRef = useRef(borrar);
  useEffect(() => { borrarRef.current = borrar; });

  const pintar = (c: string) => {
    const s = selRef.current;
    if (s?.t !== "n") return;
    commit({ ...dRef.current, nodes: dRef.current.nodes.map((n) => (n.id === s.id ? { ...n, color: c } : n)) });
  };

  const ponerTexto = (id: string, text: string) => {
    const t = text.trim() || "Idea";
    commit({ ...dRef.current, nodes: dRef.current.nodes.map((n) => (n.id === id ? { ...n, text: t } : n)) });
  };

  // Evita que el editor de notas intercepte teclas y clics; Suprimir borra lo seleccionado
  useEffect(() => {
    const h = host.current;
    if (!h) return;
    const teclas = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      e.stopPropagation();
      if ((e.key === "Delete" || e.key === "Backspace") && selRef.current) { e.preventDefault(); borrarRef.current(); }
    };
    const frenar = (e: Event) => e.stopPropagation();
    h.addEventListener("keydown", teclas);
    ["keyup", "keypress", "mousedown", "dblclick"].forEach((n) => h.addEventListener(n, frenar));
    return () => {
      h.removeEventListener("keydown", teclas);
      ["keyup", "keypress", "mousedown", "dblclick"].forEach((n) => h.removeEventListener(n, frenar));
    };
  }, []);

  /* ── Arrastrar un bloque ── */
  const arrastrar = (e: React.PointerEvent, n: N) => {
    e.stopPropagation();
    host.current?.focus();
    setSel({ t: "n", id: n.id });
    if (editando) return;
    const p0 = pt(e);
    const ox = p0.x - n.x, oy = p0.y - n.y, w = anc(n.text);
    const W = svg.current!.clientWidth;
    let movido = false;
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      const q = pt(ev);
      if (!movido && Math.hypot(q.x - p0.x, q.y - p0.y) < 3) return;
      movido = true;
      const nx = Math.max(0, Math.min(W - w, q.x - ox));
      const ny = Math.max(0, q.y - oy);
      preview({ ...dRef.current, nodes: dRef.current.nodes.map((m) => (m.id === n.id ? { ...m, x: nx, y: ny } : m)) });
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      document.body.style.userSelect = "";
      if (movido) commit(dRef.current);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  /* ── Conectar: arrastra desde un punto del bloque ── */
  const conectar = (e: React.PointerEvent, n: N) => {
    e.preventDefault();
    e.stopPropagation();
    const p0 = pt(e);
    setLink({ from: n.id, x: p0.x, y: p0.y, sobre: null });
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      const q = pt(ev);
      setLink({ from: n.id, x: q.x, y: q.y, sobre: nodoEn(q.x, q.y)?.id ?? null });
    };
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      document.body.style.userSelect = "";
      setLink(null);
      const q = pt(ev);
      const cur = dRef.current;
      const src = cur.nodes.find((m) => m.id === n.id);
      if (!src) return;
      const t = nodoEn(q.x, q.y);
      if (t) {
        const ya = cur.edges.some((x) => (x.from === src.id && x.to === t.id) || (x.from === t.id && x.to === src.id));
        if (t.id !== src.id && !ya) commit({ ...cur, edges: [...cur.edges, { id: uid(), from: src.id, to: t.id }] });
      } else {
        const c = centro(src);
        if (Math.hypot(q.x - c.x, q.y - c.y) > 60) {
          // Soltar en vacío crea un bloque nuevo ya conectado
          const nn: N = { id: uid(), x: Math.max(0, q.x - 55), y: Math.max(0, q.y - H / 2), text: "Idea", color: src.color };
          commit({ nodes: [...cur.nodes, nn], edges: [...cur.edges, { id: uid(), from: src.id, to: nn.id }] });
          setSel({ t: "n", id: nn.id });
          setEditando(nn.id);
        }
      }
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  /* ── Dibujo ── */
  const alto = Math.max(300, ...d.nodes.map((n) => n.y + H + 60));
  const byId = (id: string) => d.nodes.find((n) => n.id === id);
  const selNodo = sel?.t === "n" ? byId(sel.id) : undefined;

  return (
    <Flotante
      p={p}
      tarjeta
      extra={<button type="button" onClick={() => deleteNode()} title="Borrar diagrama" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>}
    >
      <div ref={host} tabIndex={0} className="outline-none">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={agregar} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-2.5 py-1 text-sm font-medium text-black">
            <Plus size={14} /> Bloque
          </button>
          <button type="button" onClick={borrar} disabled={!sel} className={btnMini}><Trash2 size={13} /> Borrar</button>
          {selNodo && (
            <span className="flex items-center gap-1">
              {COLORES.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`} onClick={() => pintar(c)}
                  className="h-4 w-4 rounded-full border border-[var(--border)]"
                  style={{ background: c, outline: selNodo.color === c ? "2px solid var(--text)" : "none", outlineOffset: 1 }} />
              ))}
            </span>
          )}
        </div>
        <p className="mb-2 text-xs text-[var(--muted)]">
          {selNodo
            ? "Arrastra un punto ● hacia otro bloque para conectar (o suéltalo en vacío para crear uno nuevo). Doble clic para escribir."
            : "Toca un bloque para seleccionarlo · arrástralo para moverlo · doble clic para escribir."}
        </p>

        <svg ref={svg} onPointerDown={() => { host.current?.focus(); setSel(null); setEditando(null); }}
          style={{ width: "100%", height: alto, touchAction: "none" }} className="rounded-lg bg-[var(--bg)]">
          <defs>
            <marker id={`f${marcador}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="#9a958c" />
            </marker>
            <marker id={`s${marcador}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="#d97757" />
            </marker>
          </defs>

          {d.edges.map((e) => {
            const a = byId(e.from), b = byId(e.to);
            if (!a || !b) return null;
            const p1 = borde(a, centro(b).x, centro(b).y), p2 = borde(b, centro(a).x, centro(a).y);
            const on = sel?.t === "e" && sel.id === e.id;
            return (
              <g key={e.id} onPointerDown={(ev) => { ev.stopPropagation(); host.current?.focus(); setSel({ t: "e", id: e.id }); }} style={{ cursor: "pointer" }}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={14} />
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={on ? "#d97757" : "#9a958c"} strokeWidth={on ? 2.5 : 1.8}
                  markerEnd={`url(#${on ? "s" : "f"}${marcador})`} />
              </g>
            );
          })}

          {link && byId(link.from) && (() => {
            const a = byId(link.from)!;
            const p1 = borde(a, link.x, link.y);
            return <line x1={p1.x} y1={p1.y} x2={link.x} y2={link.y} stroke="#d97757" strokeWidth={2} strokeDasharray="5 4" pointerEvents="none" />;
          })()}

          {d.nodes.map((n) => {
            const w = anc(n.text);
            const on = sel?.t === "n" && sel.id === n.id;
            const objetivo = link?.sobre === n.id && link.from !== n.id;
            return (
              <g key={n.id} onPointerDown={(e) => arrastrar(e, n)} onDoubleClick={() => { setSel({ t: "n", id: n.id }); setEditando(n.id); }}
                style={{ cursor: editando === n.id ? "text" : "grab" }}>
                <rect x={n.x} y={n.y} width={w} height={H} rx={10} fill={n.color} fillOpacity={0.2}
                  stroke={objetivo ? "#ffffff" : n.color} strokeWidth={on || objetivo ? 3 : 1.5} />
                {editando === n.id ? (
                  <foreignObject x={n.x} y={n.y} width={w} height={H}>
                    <input autoFocus defaultValue={n.text} spellCheck={false}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={(e) => { if (cancelar.current) cancelar.current = false; else ponerTexto(n.id, e.currentTarget.value); setEditando(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") { cancelar.current = true; e.currentTarget.blur(); }
                      }}
                      style={{ width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", textAlign: "center", color: "var(--text)", fontSize: 14 }} />
                  </foreignObject>
                ) : (
                  <text x={n.x + w / 2} y={n.y + H / 2} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize={14} pointerEvents="none">{n.text}</text>
                )}
                {on && !editando && ([[n.x + w, n.y + H / 2], [n.x, n.y + H / 2], [n.x + w / 2, n.y], [n.x + w / 2, n.y + H]] as [number, number][]).map(([hx, hy], i) => (
                  <circle key={i} cx={hx} cy={hy} r={6} fill="#d97757" stroke="var(--bg)" strokeWidth={2} style={{ cursor: "crosshair" }}
                    onPointerDown={(e) => conectar(e, n)} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </Flotante>
  );
}

/* ───────── Diagramas antiguos (Mermaid, solo lectura) ───────── */
function Legado(p: NodeViewProps) {
  const { node, updateAttributes, deleteNode } = p;
  const code = node.attrs.code as string;
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let vivo = true;
    const id = "m" + crypto.randomUUID().replace(/-/g, "");
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const r = await mermaid.render(id, code);
        if (vivo) { setSvg(r.svg); setErr(""); }
      } catch (e) {
        document.getElementById("d" + id)?.remove();
        if (vivo) setErr((e as Error).message?.split("\n")[0] ?? "Error en el diagrama");
      }
    })();
    return () => { vivo = false; };
  }, [code]);

  return (
    <Flotante
      p={p}
      tarjeta
      extra={
        <>
          <button type="button" title="Convertir a editor visual (reemplaza este diagrama)" className="flot-btn"
            onClick={() => updateAttributes({ code: "", data: PLANTILLAS_DIAGRAMA["Mapa mental"] })}><RefreshCw size={14} /></button>
          <button type="button" onClick={() => deleteNode()} title="Borrar diagrama" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>
        </>
      }
    >
      {err ? <p className="text-sm text-red-400">{err}</p> : <div className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />}
    </Flotante>
  );
}

function Vista(p: NodeViewProps) {
  const { data, code } = p.node.attrs as { data: string; code: string };
  return !data && code ? <Legado {...p} /> : <Editor {...p} />;
}

export const Diagrama = Node.create({
  name: "diagrama",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      data: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-data") ?? "",
        renderHTML: (a: Record<string, unknown>) => ({ "data-data": a.data as string }),
      },
      code: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-code") ?? "",
        renderHTML: (a: Record<string, unknown>) => ({ "data-code": a.code as string }),
      },
      ...atributosFlotante,
    };
  },
  parseHTML() { return [{ tag: "div[data-diagrama]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-diagrama": "" })]; },
  addNodeView() { return ReactNodeViewRenderer(Vista); },
});