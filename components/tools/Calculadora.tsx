"use client";
import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { evaluar } from "@/lib/math";
import { card, inp, btn, btn2 } from "./ui";

type Fila = { expr: string; res: string; error?: boolean };

const ATAJOS = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "log(", "ln(", "sqrt(", "abs(", "^", "pi", "e", "deg", "derivative(\"x^2\", \"x\")", "simplify(\"2x+x\")", "factorial(", "nCr(", "mod("];

export default function Calculadora() {
  const [expr, setExpr] = useState("");
  const [hist, setHist] = useState<Fila[]>([]);
  const scope = useRef<Record<string, unknown>>({});
  const ref = useRef<HTMLInputElement>(null);

  const calcular = async () => {
    const e = expr.trim();
    if (!e) return;
    const limpio = e.replace(/\bln\(/g, "log(").replace(/\bnCr\(/g, "combinations(");
    try {
      const res = await evaluar(limpio, scope.current);
      scope.current.ans = res;
      setHist((h) => [{ expr: e, res }, ...h]);
      setExpr("");
    } catch (err) {
      setHist((h) => [{ expr: e, res: (err as Error).message, error: true }, ...h]);
    }
  };

  const insertar = (t: string) => {
    setExpr((x) => x + t);
    ref.current?.focus();
  };

  return (
    <div className={card}>
      <div className="flex gap-2">
        <input
          ref={ref}
          autoFocus
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && calcular()}
          placeholder="Ej: 2*sin(30 deg) + sqrt(16)   ·   x = 5   ·   x^2 + 1"
          className={inp + " font-mono"}
        />
        <button onClick={calcular} className={btn}>=</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ATAJOS.map((a) => (
          <button key={a} onClick={() => insertar(a)} className={btn2 + " font-mono text-xs"}>
            {a.length > 14 ? a.split("(")[0] + "(…)" : a}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Radianes por defecto: usa <code>sin(30 deg)</code> para grados. Puedes guardar variables (<code>a = 3</code>) y usar <code>ans</code>.
        Soporta matrices <code>[[1,2],[3,4]]</code>, números complejos <code>(2+3i)*(1-i)</code>, unidades <code>5 km to m</code> y derivadas simbólicas.
      </p>

      <div className="mt-4 space-y-2">
        {hist.length === 0 && <p className="text-sm text-[var(--muted)]">El historial aparecerá aquí.</p>}
        {hist.map((h, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg)] px-3 py-2 font-mono text-sm">
            <span className="min-w-0 truncate text-[var(--muted)]">{h.expr}</span>
            <span className={"flex shrink-0 items-center gap-2 " + (h.error ? "text-red-400" : "text-[var(--accent)]")}>
              {h.error ? "Error" : "= " + h.res}
              {!h.error && (
                <button onClick={() => navigator.clipboard.writeText(h.res)} aria-label="Copiar" className="text-[var(--muted)] hover:text-[var(--text)]">
                  <Copy size={14} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
