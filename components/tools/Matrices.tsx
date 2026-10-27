"use client";
import { useState } from "react";
import { getMath } from "@/lib/math";
import { card, inp, btn, btn2 } from "./ui";

type M = string[][];
const vacia = (n: number, m = n): M => Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (n === m && i === j ? "1" : "0")));

function Grid({ nombre, m, set }: { nombre: string; m: M; set: (m: M) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{nombre}</p>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${m[0].length}, 4.2rem)` }}>
        {m.map((fila, i) =>
          fila.map((v, j) => (
            <input key={`${i}-${j}`} value={v} onChange={(e) => set(m.map((f, a) => f.map((x, b) => (a === i && b === j ? e.target.value : x))))}
              className={inp + " !px-2 !py-1.5 text-center font-mono"} />
          )),
        )}
      </div>
    </div>
  );
}

export default function Matrices() {
  const [n, setN] = useState(3);
  const [A, setA] = useState<M>(vacia(3));
  const [B, setB] = useState<M>(vacia(3));
  const [res, setRes] = useState<string>("");
  const [err, setErr] = useState(false);

  const cambiarN = (k: number) => { setN(k); setA(vacia(k)); setB(vacia(k)); setRes(""); };
  const num = (m: M) => m.map((f) => f.map((x) => Number(x.replace(",", "."))));

  const op = async (nombre: string) => {
    try {
      const math = await getMath();
      const a = math.matrix(num(A)), b = math.matrix(num(B));
      let r: unknown;
      switch (nombre) {
        case "det(A)": r = math.det(a); break;
        case "A⁻¹": r = math.inv(a); break;
        case "Aᵀ": r = math.transpose(a); break;
        case "A + B": r = math.add(a, b); break;
        case "A · B": r = math.multiply(a, b); break;
        case "Eigen(A)": { const e = math.eigs(a); r = e.values; break; }
        case "Ax = b (col. 1 de B)": r = math.lusolve(a, math.flatten(math.subset(b, math.index(math.range(0, n), 0)))); break;
        default: return;
      }
      setRes(`${nombre}\n${math.format(r, { precision: 8 })}`);
      setErr(false);
    } catch (e) {
      setRes((e as Error).message); setErr(true);
    }
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">Tamaño:</span>
        {[2, 3, 4].map((k) => (
          <button key={k} onClick={() => cambiarN(k)} className={k === n ? btn : btn2}>{k}×{k}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-6">
        <Grid nombre="A" m={A} set={setA} />
        <Grid nombre="B" m={B} set={setB} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["det(A)", "A⁻¹", "Aᵀ", "A + B", "A · B", "Eigen(A)", "Ax = b (col. 1 de B)"].map((o) => (
          <button key={o} onClick={() => op(o)} className={btn2}>{o}</button>
        ))}
      </div>
      {res && (
        <pre className={"mt-4 overflow-x-auto rounded-lg bg-[var(--bg)] p-3 font-mono text-sm " + (err ? "text-red-400" : "text-[var(--accent)]")}>{res}</pre>
      )}
    </div>
  );
}
