"use client";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { Flotante, atributosFlotante } from "./bloque";

function Vista(p: NodeViewProps) {
  const { src, alt } = p.node.attrs as { src: string; alt?: string };
  return (
    <Flotante p={p} extra={<button type="button" onClick={() => p.deleteNode()} title="Borrar imagen" className="flot-btn hover:!text-red-400"><Trash2 size={14} /></button>}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? ""} draggable={false} className="block h-auto w-full rounded-xl" />
    </Flotante>
  );
}

export const ImagenFlotante = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), ...atributosFlotante };
  },
  addNodeView() {
    return ReactNodeViewRenderer(Vista);
  },
});