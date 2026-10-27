import { Extension, InputRule } from "@tiptap/core";

// Comandos estilo LaTeX: escribe \alpha y espacio → α
export const COMANDOS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", epsilon: "ε", theta: "θ", lambda: "λ", mu: "μ",
  pi: "π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", phi: "φ", omega: "ω", Omega: "Ω", ohm: "Ω",
  sqrt: "√", cbrt: "∛", int: "∫", iint: "∬", oint: "∮", sum: "∑", prod: "∏", inf: "∞", partial: "∂", nabla: "∇",
  pm: "±", times: "×", div: "÷", neq: "≠", leq: "≤", geq: "≥", approx: "≈", equiv: "≡", prop: "∝",
  to: "→", implies: "⇒", iff: "⇔", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", union: "∪", inter: "∩",
  empty: "∅", forall: "∀", exists: "∃", therefore: "∴", because: "∵", and: "∧", or: "∨", not: "¬", deg: "°",
  N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ", C: "ℂ",
};

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const mapDigitos = (s: string, tabla: string) => s.replace(/\d/g, (d) => tabla[Number(d)]);

const reemplazo = (find: RegExp, texto: string) =>
  new InputRule({
    find,
    handler: ({ state, range }) => {
      state.tr.insertText(texto, range.from, range.to);
    },
  });

export const Atajos = Extension.create({
  name: "atajos",
  addInputRules() {
    return [
      reemplazo(/<->$/, "↔"),
      reemplazo(/->$/, "→"),
      reemplazo(/<-$/, "←"),
      reemplazo(/=>$/, "⇒"),
      reemplazo(/<=$/, "≤"),
      reemplazo(/>=$/, "≥"),
      reemplazo(/!=$/, "≠"),
      reemplazo(/~=$/, "≈"),
      reemplazo(/\+-$/, "±"),
      // \alpha + espacio
      new InputRule({
        find: /\\([a-zA-Z]+) $/,
        handler: ({ state, range, match }) => {
          const s = COMANDOS[match[1]];
          if (!s) return null;
          state.tr.insertText(s, range.from, range.to);
        },
      }),
      // x^2 + espacio → x²    ·   x_1 + espacio → x₁
      new InputRule({
        find: /\^(-?\d+) $/,
        handler: ({ state, range, match }) => {
          const neg = match[1].startsWith("-") ? "⁻" : "";
          state.tr.insertText(neg + mapDigitos(match[1].replace("-", ""), SUP) + " ", range.from, range.to);
        },
      }),
      new InputRule({
        find: /_(\d+) $/,
        handler: ({ state, range, match }) => {
          state.tr.insertText(mapDigitos(match[1], SUB) + " ", range.from, range.to);
        },
      }),
    ];
  },
});

export const AYUDA_ATAJOS: [string, string][] = [
  ["Ctrl + Enter", "Calcula la línea (o selección) y agrega = resultado"],
  ["->  <-  <->  =>", "→  ←  ↔  ⇒"],
  ["<=  >=  !=  ~=  +-", "≤  ≥  ≠  ≈  ±"],
  ["x^2 + espacio", "x² (también ^3, ^-1…)"],
  ["x_1 + espacio", "x₁ (subíndices)"],
  ["\\alpha + espacio", "α — también \\theta, \\pi, \\sqrt, \\int, \\sum, \\inf, \\in, \\forall…"],
  ["Ctrl + B / I / U", "Negritas, cursiva, subrayado"],
];
