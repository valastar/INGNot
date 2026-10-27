"use client";
import { useEffect, useRef } from "react";
import type { MathfieldElement } from "mathlive";

type Props = {
  inicial: string;
  onLatex: (latex: string) => void;
  onFoco?: () => void;
  reg?: (el: MathfieldElement | null) => void;
};

export default function CampoMath({ inicial, onLatex, onFoco, reg }: Props) {
  const cont = useRef<HTMLDivElement>(null);
  const ini = useRef(inicial);
  const cbs = useRef({ onLatex, onFoco, reg });
  useEffect(() => { cbs.current = { onLatex, onFoco, reg }; });

  useEffect(() => {
    const host = cont.current;
    if (!host) return;
    let vivo = true;
    let el: MathfieldElement | null = null;

    // Evita que el editor de notas intercepte teclas y clics del campo
    const frenar = (e: Event) => e.stopPropagation();
    const eventos = ["keydown", "keyup", "keypress", "beforeinput", "input", "paste", "copy", "cut", "mousedown", "pointerdown", "dblclick"];
    eventos.forEach((n) => host.addEventListener(n, frenar));

    (async () => {
      const { MathfieldElement } = await import("mathlive");
      if (!vivo) return;
      MathfieldElement.fontsDirectory = null; // usa las fuentes de KaTeX que ya cargas
      MathfieldElement.soundsDirectory = null;
      el = new MathfieldElement();
      el.mathVirtualKeyboardPolicy = "manual";
      el.value = ini.current;
      el.addEventListener("input", () => cbs.current.onLatex(el!.getValue("latex")));
      el.addEventListener("focusin", () => cbs.current.onFoco?.());
      host.appendChild(el);
      cbs.current.reg?.(el);
    })();

    return () => {
      vivo = false;
      eventos.forEach((n) => host.removeEventListener(n, frenar));
      cbs.current.reg?.(null);
      el?.remove();
    };
  }, []);

  return <div ref={cont} />;
}