"use client";
import { useState } from "react";
import { getMath } from "@/lib/math";
import { card, inp, btn } from "./ui";

/* ───────── Ecuación cuadrática ───────── */
export function Cuadratica() {
  const [v, setV] = useState({ a: "1", b: "-3", c: "2" });
  const a = +v.a, b = +v.b, c = +v.c;
  const D = b * b - 4 * a * c;
  const f = (n: number) => +n.toFixed(6);
  let sol = "";
  if (!a) sol = "a no puede ser 0 (no es cuadrática)";
  else if (D >= 0) sol = `x₁ = ${f((-b + Math.sqrt(D)) / (2 * a))}   ·   x₂ = ${f((-b - Math.sqrt(D)) / (2 * a))}`;
  else sol = `x₁ = ${f(-b / (2 * a))} + ${f(Math.sqrt(-D) / (2 * a))}i   ·   x₂ = ${f(-b / (2 * a))} − ${f(Math.sqrt(-D) / (2 * a))}i`;
  return (
    <div className={card}>
      <p className="mb-3 text-sm text-[var(--muted)]">ax² + bx + c = 0</p>
      <div className="flex gap-3">
        {(["a", "b", "c"] as const).map((k) => (
          <label key={k} className="flex-1 text-sm">{k}<input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={inp + " mt-1 font-mono"} /></label>
        ))}
      </div>
      <p className="mt-4 font-mono text-sm">Discriminante Δ = {f(D)}</p>
      <p className="mt-1 font-mono text-[var(--accent)]">{sol}</p>
      {a !== 0 && <p className="mt-1 font-mono text-sm text-[var(--muted)]">Vértice: ({f(-b / (2 * a))}, {f(c - (b * b) / (4 * a))})</p>}
    </div>
  );
}

/* ───────── Conversor de unidades ───────── */
const PRESETS: [string, string][] = [["km/h", "m/s"], ["psi", "kPa"], ["inch", "cm"], ["lbf", "N"], ["hp", "kW"], ["degF", "degC"], ["BTU", "J"], ["mile", "km"]];
export function Unidades() {
  const [val, setVal] = useState("60");
  const [de, setDe] = useState("km/h");
  const [a, setA] = useState("m/s");
  const [out, setOut] = useState("");

  const convertir = async (v = val, d = de, t = a) => {
    try {
      const math = await getMath();
      const r = math.unit(`${v} ${d}`).toNumber(t);
      setOut(`${v} ${d} = ${+r.toPrecision(8)} ${t}`);
    } catch { setOut("Unidades incompatibles o no reconocidas"); }
  };
  return (
    <div className={card}>
      <div className="flex flex-wrap items-end gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} className={inp + " !w-28 font-mono"} />
        <input value={de} onChange={(e) => setDe(e.target.value)} className={inp + " !w-32 font-mono"} />
        <span className="pb-2 text-[var(--muted)]">→</span>
        <input value={a} onChange={(e) => setA(e.target.value)} className={inp + " !w-32 font-mono"} />
        <button onClick={() => convertir()} className={btn}>Convertir</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map(([d, t]) => (
          <button key={d + t} onClick={() => { setDe(d); setA(t); convertir(val, d, t); }}
            className="rounded-md border border-[var(--border)] px-2 py-1 font-mono text-xs text-[var(--muted)] hover:text-[var(--text)]">{d} → {t}</button>
        ))}
      </div>
      {out && <p className="mt-4 font-mono text-[var(--accent)]">{out}</p>}
    </div>
  );
}

/* ───────── Bases numéricas ───────── */
export function Bases() {
  const [txt, setTxt] = useState("255");
  const [base, setBase] = useState(10);
  const n = parseInt(txt.trim() || "0", base);
  const ok = Number.isFinite(n) && !isNaN(n);
  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <input value={txt} onChange={(e) => setTxt(e.target.value)} className={inp + " font-mono"} />
        {[2, 8, 10, 16].map((b) => (
          <button key={b} onClick={() => setBase(b)} className={"rounded-lg px-3 py-2 text-sm " + (b === base ? "bg-[var(--accent)] text-black" : "border border-[var(--border)] text-[var(--muted)]")}>
            {b === 2 ? "BIN" : b === 8 ? "OCT" : b === 10 ? "DEC" : "HEX"}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1 font-mono text-sm">
        {[["Binario", 2], ["Octal", 8], ["Decimal", 10], ["Hexadecimal", 16]].map(([l, b]) => (
          <p key={l as string}><span className="inline-block w-28 text-[var(--muted)]">{l}</span><span className="text-[var(--accent)]">{ok ? n.toString(b as number).toUpperCase() : "—"}</span></p>
        ))}
        {ok && <p><span className="inline-block w-28 text-[var(--muted)]">Complemento a 2 (8 bits)</span><span className="text-[var(--accent)]">{((n & 0xff) >>> 0).toString(2).padStart(8, "0")}</span></p>}
      </div>
    </div>
  );
}

/* ───────── Estadística ───────── */
export function Estadistica() {
  const [txt, setTxt] = useState("12, 15, 9, 20, 15, 18, 11");
  const [out, setOut] = useState<[string, string][]>([]);
  const calc = async () => {
    const d = txt.split(/[\s,;]+/).map(Number).filter((x) => !isNaN(x));
    if (!d.length) return setOut([]);
    const m = await getMath();
    const f = (x: unknown) => String(+Number(x).toPrecision(8));
    const moda = m.mode(d).join(", ");
    setOut([
      ["n", String(d.length)], ["Suma", f(m.sum(d))], ["Media", f(m.mean(d))], ["Mediana", f(m.median(d))], ["Moda", moda],
      ["Mín / Máx", `${f(m.min(d))} / ${f(m.max(d))}`], ["Rango", f(Number(m.max(d)) - Number(m.min(d)))],
      ["Varianza (muestral)", d.length > 1 ? f(m.variance(d)) : "—"], ["Desv. est. (muestral)", d.length > 1 ? f(m.std(d)) : "—"],
      ["Desv. est. (poblacional)", f(m.std(d, "uncorrected"))],
    ]);
  };
  return (
    <div className={card}>
      <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={3} className={inp + " font-mono"} placeholder="Datos separados por coma, espacio o salto de línea" />
      <button onClick={calc} className={btn + " mt-3"}>Calcular</button>
      <div className="mt-4 grid gap-1 font-mono text-sm sm:grid-cols-2">
        {out.map(([k, v]) => (<p key={k}><span className="text-[var(--muted)]">{k}: </span><span className="text-[var(--accent)]">{v}</span></p>))}
      </div>
    </div>
  );
}
