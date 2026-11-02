"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  NodeViewWrapper,
  type NodeViewProps,
  type Editor,
} from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  GripVertical,
} from "lucide-react";

export type Lado = "izq" | "centro" | "der";

const numONull = (el: HTMLElement, nombre: string) => {
  const v = el.getAttribute(nombre);
  return v === null || v === "" ? null : Number(v);
};

// Atributos que comparten todos los bloques movibles
export const atributosFlotante = {
  lado: {
    default: "centro",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-lado") ?? "centro",
    renderHTML: (a: Record<string, unknown>) => ({
      "data-lado": a.lado as string,
    }),
  },
  ancho: {
    default: 100,
    parseHTML: (el: HTMLElement) =>
      Number(el.getAttribute("data-ancho") ?? 100),
    renderHTML: (a: Record<string, unknown>) => ({
      "data-ancho": String(a.ancho),
    }),
  },
  // Posición libre dentro de la nota (px). null = el bloque sigue el flujo normal del texto
  x: {
    default: null,
    parseHTML: (el: HTMLElement) => numONull(el, "data-x"),
    renderHTML: (a: Record<string, unknown>) =>
      a.x == null ? {} : { "data-x": String(a.x) },
  },
  y: {
    default: null,
    parseHTML: (el: HTMLElement) => numONull(el, "data-y"),
    renderHTML: (a: Record<string, unknown>) =>
      a.y == null ? {} : { "data-y": String(a.y) },
  },
};

const limitar = (n: number, a: number, b: number) =>
  Math.min(b, Math.max(a, n));

// ── Reflujo: el texto se acomoda al lado de los bloques libres ──
const HUECO = 16; // separación entre bloque y texto (px)
const MIN_ANCHO = 140; // si el lado queda más angosto, el texto no se mueve

function reflujo(editor: Editor) {
  const cont = editor.view.dom as HTMLElement;
  const obs = (
    editor.view as unknown as { domObserver?: { stop(): void; start(): void } }
  ).domObserver;
  obs?.stop();
  try {
    ["--rf-side", "--rf-w", "--rf-h", "--rf-mt"].forEach((k) =>
      cont.style.removeProperty(k),
    );
    const hijos = Array.from(cont.children).filter(
      (h): h is HTMLElement =>
        h instanceof HTMLElement &&
        !h.classList.contains("flot") &&
        !h.classList.contains("tableWrapper") &&
        !h.querySelector(".flot"),
    );
    hijos.forEach((h) => {
      h.style.marginLeft = "";
      h.style.marginRight = "";
    });

    const libres = Array.from(
      cont.querySelectorAll<HTMLElement>(".flot-libre"),
    ).sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
    if (!libres.length) return;

    const cr = cont.getBoundingClientRect();
    const [principal, ...otros] = libres;

    // Bloque principal: float espaciador (::before). Solo ocupa la franja vertical del bloque
    const pr = principal.getBoundingClientRect();
    const izq = pr.left - cr.left;
    const der = cr.right - pr.right;
    if (Math.max(izq, der) - HUECO >= MIN_ANCHO) {
      const textoIzq = izq >= der; // el texto se queda en el lado con más espacio
      cont.style.setProperty("--rf-side", textoIzq ? "right" : "left");
      cont.style.setProperty(
        "--rf-w",
        `${textoIzq ? cr.right - pr.left + HUECO : pr.right - cr.left + HUECO}px`,
      );
      const arriba = Math.max(0, pr.top - cr.top - 4);
      cont.style.setProperty("--rf-mt", `${arriba}px`);
      cont.style.setProperty("--rf-h", `${arriba + pr.height + 8}px`);
    }

    // Bloques extra: método anterior de márgenes (solo si hay más de uno libre)
    for (let pasada = 0; otros.length && pasada < 2; pasada++) {
      for (const h of hijos) {
        const r = h.getBoundingClientRect();
        let ml = 0,
          mr = 0;
        for (const b of otros) {
          const br = b.getBoundingClientRect();
          if (r.bottom <= br.top - 4 || r.top >= br.bottom + 4) continue;
          const i = br.left - cr.left;
          const d = cr.right - br.right;
          if (d >= i) {
            if (d >= MIN_ANCHO) ml = Math.max(ml, br.right - cr.left + HUECO);
          } else if (i >= MIN_ANCHO)
            mr = Math.max(mr, cr.right - br.left + HUECO);
        }
        h.style.marginLeft = ml ? `${ml}px` : "";
        h.style.marginRight = mr ? `${mr}px` : "";
      }
    }
  } finally {
    obs?.start();
  }
}

const pendiente = new WeakMap<Editor, number>();
const observadores = new WeakSet<Editor>();

function programar(editor: Editor) {
  if (pendiente.has(editor)) return;
  pendiente.set(
    editor,
    requestAnimationFrame(() => {
      pendiente.delete(editor);
      if (!editor.isDestroyed) reflujo(editor);
    }),
  );
}

// Se engancha una sola vez por editor: reacomoda cuando cambia el texto o el ancho
function activar(editor: Editor) {
  if (observadores.has(editor)) return;
  observadores.add(editor);
  const cont = editor.view.dom as HTMLElement;
  new MutationObserver(() => programar(editor)).observe(cont, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  new ResizeObserver(() => programar(editor)).observe(cont);
}

// Altura "real" de la nota: último texto o altura mínima. No cuenta el espaciador del reflujo,
// para que mover el bloque hacia abajo no haga crecer la nota.
// Altura "natural" de la nota (texto a ancho completo). Se mide sin el espaciador del reflujo:
// si lo contara, mover el bloque hacia abajo alargaría el texto y el límite crecería sin fin.
function altoNota(cont: HTMLElement) {
  const claves = ["--rf-side", "--rf-w", "--rf-h", "--rf-mt"];
  const guardado = claves.map((k) => cont.style.getPropertyValue(k));
  claves.forEach((k) => cont.style.removeProperty(k));
  try {
    const cr = cont.getBoundingClientRect();
    let fin = parseFloat(getComputedStyle(cont).minHeight) || 0;
    for (const h of Array.from(cont.children)) {
      if (!(h instanceof HTMLElement)) continue;
      if (h.classList.contains("flot-libre") || h.querySelector(".flot-libre"))
        continue;
      fin = Math.max(fin, h.getBoundingClientRect().bottom - cr.top);
    }
    return fin;
  } finally {
    claves.forEach((k, i) => {
      if (guardado[i]) cont.style.setProperty(k, guardado[i]);
    });
  }
}

type Props = {
  p: NodeViewProps;
  children: ReactNode;
  extra?: ReactNode; // botones extra en la barra (editar, borrar…)
  conAlto?: boolean; // si la esquina también cambia el alto (gráficas)
  tarjeta?: boolean; // fondo y borde tipo tarjeta
};

export function Flotante({ p, children, extra, conAlto, tarjeta }: Props) {
  const { node, updateAttributes } = p;
  const { lado, ancho, alto, x, y } = node.attrs as {
    lado: Lado;
    ancho: number;
    alto?: number;
    x: number | null;
    y: number | null;
  };
  const libre = x != null && y != null;
  const ref = useRef<HTMLDivElement>(null);
  const anchoMax = lado === "centro" ? 100 : 70;

  const raiz = () => ref.current?.closest(".flot") as HTMLElement | null;
  const nota = () => raiz()?.closest(".tiptap") as HTMLElement | null;

  // Vuelve al flujo normal del texto
  const ponerLado = (l: Lado) =>
    updateAttributes({
      lado: l,
      x: null,
      y: null,
      ancho: l === "centro" ? ancho : Math.min(ancho, 70),
    });
  const ponerAncho = (a: number) =>
    updateAttributes({ ancho: Math.min(a, libre ? 100 : anchoMax) });

  // ── Mantener el bloque siempre dentro de la nota ──
  useEffect(() => {
    if (!libre) return;
    const el = raiz();
    const cont = nota();
    if (!el || !cont) return;
    const ajustar = () => {
      const nx = Math.round(
        limitar(x!, 0, Math.max(0, cont.clientWidth - el.offsetWidth)),
      );
      const ny = Math.round(
        limitar(y!, 0, Math.max(0, altoNota(cont) - el.offsetHeight)),
      );
      if (nx !== x || ny !== y) updateAttributes({ x: nx, y: ny });
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(cont);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libre, x, y, ancho, alto]);

  // ── Acomodar el texto alrededor de este bloque ──
  useEffect(() => {
    activar(p.editor);
    programar(p.editor);
    const el = raiz();
    if (!libre || !el) return () => programar(p.editor);
    const ro = new ResizeObserver(() => programar(p.editor));
    ro.observe(el);
    return () => {
      ro.disconnect();
      programar(p.editor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libre, x, y, ancho, alto]);

  // ── Redimensionar con la esquina ──
  const redimensionar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cont = nota();
    if (!cont) return;
    const W = cont.clientWidth,
      x0 = e.clientX,
      y0 = e.clientY,
      a0 = ancho,
      h0 = alto ?? 0;
    const signo = !libre && lado === "der" ? -1 : 1;
    const k = !libre && lado === "centro" ? 2 : 1;
    const maxA = libre ? Math.min(100, ((W - (x ?? 0)) / W) * 100) : anchoMax;
    const maxH = libre ? Math.min(800, altoNota(cont) - (y ?? 0)) : 800;
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      const a = limitar(
        a0 + ((signo * k * (ev.clientX - x0)) / W) * 100,
        15,
        maxA,
      );
      updateAttributes({
        ancho: Math.round(a),
        ...(conAlto
          ? {
              alto: Math.round(
                limitar(h0 + ev.clientY - y0, 120, Math.max(120, maxH)),
              ),
            }
          : {}),
      });
    };
    const soltar = () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  // ── Mover libremente por la nota (limitado a los bordes de la nota) ──
  const arrastrar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = raiz();
    const cont = nota();
    if (!el || !cont) return;
    const cr = cont.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const x0 = libre ? x! : er.left - cr.left;
    const y0 = libre ? y! : er.top - cr.top;
    const px0 = e.clientX,
      py0 = e.clientY;
    const w = el.offsetWidth,
      h = el.offsetHeight;
    let movido = false;
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      if (!movido && Math.hypot(ev.clientX - px0, ev.clientY - py0) < 4) return;
      movido = true;
      const nx = limitar(
        x0 + ev.clientX - px0,
        0,
        Math.max(0, cont.clientWidth - w),
      );
      const ny = limitar(
        y0 + ev.clientY - py0,
        0,
        Math.max(0, altoNota(cont) - h),
      );
      updateAttributes({ x: Math.round(nx), y: Math.round(ny) });
    };
    const soltar = () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  const b = (activo: boolean) => "flot-btn" + (activo ? " activo" : "");
  const clase = libre ? "flot-libre" : `flot-${lado}`;

  return (
    <NodeViewWrapper
      className={`flot ${clase}${tarjeta ? " bloque-nodo" : ""}`}
      style={
        libre
          ? { width: `${ancho}%`, left: x!, top: y! }
          : { width: `${ancho}%` }
      }
    >
      <div ref={ref}>
        <div className="flot-barra" contentEditable={false}>
          <button
            type="button"
            onPointerDown={arrastrar}
            title="Arrastra para moverlo por la nota"
            className="flot-btn cursor-grab"
            style={{ touchAction: "none" }}
          >
            <GripVertical size={14} />
          </button>
          <button
            type="button"
            onClick={() => ponerLado("izq")}
            title="Izquierda (texto alrededor)"
            className={b(!libre && lado === "izq")}
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => ponerLado("centro")}
            title="Centro"
            className={b(!libre && lado === "centro" && ancho < 100)}
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => ponerLado("der")}
            title="Derecha (texto alrededor)"
            className={b(!libre && lado === "der")}
          >
            <AlignRight size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              updateAttributes({ lado: "centro", ancho: 100, x: null, y: null })
            }
            title="Ancho completo"
            className={b(!libre && lado === "centro" && ancho === 100)}
          >
            <Maximize2 size={14} />
          </button>
          <span className="flot-sep" />
          {[
            ["S", 33],
            ["M", 50],
            ["L", 75],
          ].map(([t, a]) => (
            <button
              key={t}
              type="button"
              onClick={() => ponerAncho(a as number)}
              className="flot-btn text-xs font-medium"
            >
              {t}
            </button>
          ))}
          {extra && <span className="flot-sep" />}
          {extra}
        </div>
        {children}
        <span
          className={`flot-resize ${!libre && lado === "der" ? "der" : "izq"}`}
          onPointerDown={redimensionar}
          contentEditable={false}
        />
      </div>
    </NodeViewWrapper>
  );
}
