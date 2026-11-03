"use client";
import { useEffect, useRef, useState } from "react";
import { card, inp } from "./ui";
import { dibujarGrafica, COLORES } from "@/lib/graficar";


export default function Graficador() {
  const [fns, setFns] = useState(["sin(x)", "x^2/4", ""]);
  const [rango, setRango] = useState({ xmin: -10, xmax: 10 });
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current)
      dibujarGrafica(canvas.current, fns, rango.xmin, rango.xmax, COLORES);
  }, [fns, rango]);

  const zoom = (f: number) => {
    const c = (rango.xmin + rango.xmax) / 2,
      h = ((rango.xmax - rango.xmin) / 2) * f;
    setRango({ xmin: c - h, xmax: c + h });
  };

  return (
    <div className={card}>
      <div className="space-y-2">
        {fns.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: COLORES[i] }}
            />
            <span className="font-mono text-sm text-[var(--muted)]">
              f{i + 1}(x) =
            </span>
            <input
              value={f}
              onChange={(e) =>
                setFns((a) => a.map((v, j) => (j === i ? e.target.value : v)))
              }
              placeholder={i === 0 ? "sin(x)" : "(opcional)"}
              className={inp + " font-mono"}
            />
          </div>
        ))}
      </div>
      <canvas
        ref={canvas}
        className="mt-4 h-80 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]"
        onWheel={(e) => zoom(e.deltaY > 0 ? 1.15 : 0.87)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
        x de{" "}
        <input
          type="number"
          value={rango.xmin}
          onChange={(e) => setRango((r) => ({ ...r, xmin: +e.target.value }))}
          className={inp + " !w-24"}
        />
        a{" "}
        <input
          type="number"
          value={rango.xmax}
          onChange={(e) => setRango((r) => ({ ...r, xmax: +e.target.value }))}
          className={inp + " !w-24"}
        />
        <button
          onClick={() => zoom(0.7)}
          className="rounded-md border border-[var(--border)] px-2 py-1 hover:text-[var(--text)]"
        >
          ＋
        </button>
        <button
          onClick={() => zoom(1.4)}
          className="rounded-md border border-[var(--border)] px-2 py-1 hover:text-[var(--text)]"
        >
          －
        </button>
        <button
          onClick={() => setRango({ xmin: -10, xmax: 10 })}
          className="rounded-md border border-[var(--border)] px-2 py-1 hover:text-[var(--text)]"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
