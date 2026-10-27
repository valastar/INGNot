"use client";
import { useMemo, useState } from "react";
import katex from "katex";
import { Node, mergeAttributes, ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { nodeInputRule } from "@tiptap/core";

function Vista({ node, updateAttributes, editor, getPos }: NodeViewProps) {
  const { latex, display } = node.attrs as { latex: string; display: boolean };
  const [editando, setEditando] = useState(!latex);
  const [txt, setTxt] = useState(latex);

  const html = useMemo(() => {
    try { return katex.renderToString(latex || "\\square", { displayMode: display, throwOnError: false }); }
    catch { return latex; }
  }, [latex, display]);

  const guardar = (salir: boolean) => {
    updateAttributes({ latex: txt.trim() });
    setEditando(false);
    if (salir) {
      const pos = getPos();
      if (typeof pos === "number") editor.chain().focus().setTextSelection(pos + node.nodeSize).run();
    }
  };

  return (
    <NodeViewWrapper as="span" className={display ? "mate mate-bloque" : "mate"}>
      {editando ? (
        <input
          autoFocus
          value={txt}
          placeholder="LaTeX: \frac{a}{b}, \int_0^1 x^2 dx"
          style={{ width: `${Math.max(14, txt.length + 2)}ch`, maxWidth: "100%" }}
          onChange={(e) => setTxt(e.target.value)}
          onBlur={() => guardar(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); guardar(true); }
            if (e.key === "Escape") { setTxt(latex); setEditando(false); }
          }}
        />
      ) : (
        <span title="Clic para editar" onClick={() => { setTxt(latex); setEditando(true); }} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </NodeViewWrapper>
  );
}

// Escribe $x^2$ → fórmula en línea · $$\int x dx$$ → fórmula en bloque
export const Matematica = Node.create({
  name: "matematica",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      latex: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") ?? "", renderHTML: (a: Record<string, unknown>) => ({ "data-latex": a.latex as string }) },
      display: { default: false, parseHTML: (el: HTMLElement) => el.getAttribute("data-display") === "true", renderHTML: (a: Record<string, unknown>) => ({ "data-display": String(a.display) }) },
    };
  },
  parseHTML() { return [{ tag: "span[data-matematica]" }]; },
  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-matematica": "" }), `$${node.attrs.latex}$`];
  },
  addNodeView() { return ReactNodeViewRenderer(Vista); },
  addInputRules() {
    return [
      nodeInputRule({ find: /\$\$([^$\n]+)\$\$$/, type: this.type, getAttributes: (m) => ({ latex: m[1], display: true }) }),
      nodeInputRule({ find: /(?<!\$)\$([^$\n]+)\$$/, type: this.type, getAttributes: (m) => ({ latex: m[1], display: false }) }),
    ];
  },
});
