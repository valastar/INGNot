"use client";
import { useEffect, useState } from "react";
import { Node, mergeAttributes, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Pencil, Trash2 } from "lucide-react";
import { Flotante, atributosFlotante } from "./bloque";

export const PLANTILLAS_DIAGRAMA: Record<string, string> = {
  "Mapa mental": `mindmap
  root((Tema))
    Idea 1
      Detalle A
      Detalle B
    Idea 2
      Detalle C
    Idea 3`,
  "Diagrama de flujo": `flowchart TD
  A[Inicio] --> B{¿Condición?}
  B -- Sí --> C[Acción 1]
  B -- No --> D[Acción 2]
  C --> E[Fin]
  D --> E`,
  Secuencia: `sequenceDiagram
  Alumno->>Profesor: Pregunta
  Profesor-->>Alumno: Respuesta`,
  "Línea de tiempo": `timeline
  title Unidad 1
  Semana 1 : Conceptos básicos
  Semana 2 : Ejercicios
  Semana 3 : Examen`,
};

function Vista(p: NodeViewProps) {
  const { node, updateAttributes, deleteNode } = p;
  const code = node.attrs.code as string;
  const [edit, setEdit] = useState(false);
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let vivo = true;
    const id = "m" + crypto.randomUUID().replace(/-/g, "");
    const t = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const r = await mermaid.render(id, code);
        if (vivo) { setSvg(r.svg); setErr(""); }
      } catch (e) {
        document.getElementById("d" + id)?.remove();
        if (vivo) setErr((e as Error).message?.split("\n")[0] ?? "Error en el diagrama");
      }
    }, 350);
    return () => { vivo = false; clearTimeout(t); };
  }, [code]);

  return (
    <Flotante
      p={p}
      tarjeta
      extra={
        <>
          <button type="button" onClick={() => setEdit((v) => !v)} title="Editar diagrama" className={"flot-btn" + (edit ? " activo" : "")}><Pencil size={14} /></button>
          <button type="button" onClick={() => deleteNode()} title="Borrar diagrama" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>
        </>
      }
    >
      {edit && (
        <div className="mb-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {Object.keys(PLANTILLAS_DIAGRAMA).map((n) => (
              <button key={n} type="button" onClick={() => updateAttributes({ code: PLANTILLAS_DIAGRAMA[n] })}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]">{n}</button>
            ))}
          </div>
          <textarea value={code} onChange={(e) => updateAttributes({ code: e.target.value })} rows={8} spellCheck={false}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-sm outline-none focus:border-[var(--accent)]" />
        </div>
      )}
      {err ? <p className="text-sm text-red-400">{err}</p> : <div className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />}
    </Flotante>
  );
}

export const Diagrama = Node.create({
  name: "diagrama",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      code: {
        default: PLANTILLAS_DIAGRAMA["Mapa mental"],
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