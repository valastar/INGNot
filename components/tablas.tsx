"use client";
import { Node, mergeAttributes, ReactNodeViewRenderer, NodeViewContent, type NodeViewProps, type Editor } from "@tiptap/react";
import { Plugin, PluginKey, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Trash2 } from "lucide-react";
import { Flotante, atributosFlotante } from "./bloque";

function Vista(p: NodeViewProps) {
  return (
    <Flotante
      p={p}
      extra={<button type="button" onClick={() => p.deleteNode()} title="Borrar tabla" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>}
    >
      <NodeViewContent />
    </Flotante>
  );
}

// Envuelve toda tabla suelta (nuevas y de notas viejas) en el bloque movible
export function envolverTablas(state: EditorState): Transaction | null {
  const tipo = state.schema.nodes.tablaFlotante;
  const posiciones: number[] = [];
  state.doc.descendants((node, pos, parent) => {
    if (node.type.name !== "table" || parent?.type === tipo) return;
    const $p = state.doc.resolve(pos);
    if ($p.parent.canReplaceWith($p.index(), $p.index() + 1, tipo)) posiciones.push(pos);
  });
  if (!posiciones.length) return null;
  const tr = state.tr;
  for (const pos of posiciones.reverse()) {
    const n = tr.doc.nodeAt(pos)!;
    tr.replaceWith(pos, pos + n.nodeSize, tipo.create(null, n));
  }
  return tr;
}

// Borra la tabla completa (con su contenedor)
export function borrarTabla(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === "tablaFlotante") {
      editor.view.dispatch(editor.state.tr.delete($from.before(d), $from.after(d)));
      editor.commands.focus();
      return;
    }
  }
  editor.chain().focus().deleteTable().run();
}

export const TablaFlotante = Node.create({
  name: "tablaFlotante",
  group: "block",
  content: "table",
  addAttributes() {
    return { ...atributosFlotante };
  },
  parseHTML() { return [{ tag: "div[data-tabla-flotante]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-tabla-flotante": "" }), 0];
  },
  addNodeView() { return ReactNodeViewRenderer(Vista); },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("envolverTablas"),
        appendTransaction: (trs, _old, state) => (trs.some((t) => t.docChanged) ? envolverTablas(state) : null),
      }),
    ];
  },
});