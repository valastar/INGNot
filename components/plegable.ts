import { Node, mergeAttributes } from "@tiptap/core";

// Bloque plegable: el primer párrafo es el título; el resto se oculta/muestra con la flecha
export const Plegable = Node.create({
  name: "plegable",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      abierto: {
        default: true,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-abierto") !== "false",
        renderHTML: (a: Record<string, unknown>) => ({ "data-abierto": String(a.abierto) }),
      },
    };
  },
  parseHTML() { return [{ tag: "div[data-plegable]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-plegable": "", class: "plegable" }), 0]; },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let actual = node;
      const dom = document.createElement("div");
      dom.className = "plegable";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.contentEditable = "false";
      btn.className = "plegable-btn";
      btn.setAttribute("aria-label", "Mostrar u ocultar");
      const contentDOM = document.createElement("div");
      contentDOM.className = "plegable-content";
      dom.append(btn, contentDOM);
      const pintar = () => { dom.dataset.abierto = String(actual.attrs.abierto); btn.textContent = actual.attrs.abierto ? "▾" : "▸"; };
      pintar();
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const pos = getPos();
        if (typeof pos !== "number") return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { abierto: !actual.attrs.abierto }));
      });
      return {
        dom,
        contentDOM,
        update: (n) => { if (n.type !== actual.type) return false; actual = n; pintar(); return true; },
      };
    };
  },
});
