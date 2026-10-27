// Convierte LaTeX (del campo de fórmulas) a sintaxis de mathjs
function grupo(s: string, i: number): [string, number] | null {
  while (s[i] === " ") i++;
  if (s[i] !== "{") return null;
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "{") d++;
    else if (s[j] === "}" && --d === 0) return [s.slice(i + 1, j), j + 1];
  }
  return null;
}

const FUNC = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "exp"]);

export function latexAMath(latex: string): string {
  const pre = (out: string) => (/[\w).]$/.test(out) ? out + "*" : out);

  const conv = (s: string): string => {
    let out = "";
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === "\\") {
        const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
        if (!m) { i += 2; continue; }
        const cmd = m[1];
        i += m[0].length;
        if (cmd === "frac" || cmd === "dfrac" || cmd === "tfrac") {
          const a = grupo(s, i), b = a && grupo(s, a[1]);
          if (a && b) { out = pre(out) + `((${conv(a[0])})/(${conv(b[0])}))`; i = b[1]; }
        } else if (cmd === "sqrt") {
          let n = "";
          if (s[i] === "[") { const j = s.indexOf("]", i); n = s.slice(i + 1, j); i = j + 1; }
          const a = grupo(s, i);
          if (a) { out = pre(out) + (n ? `nthRoot(${conv(a[0])},${conv(n)})` : `sqrt(${conv(a[0])})`); i = a[1]; }
        } else if (cmd === "abs") {
          const a = grupo(s, i);
          if (a) { out = pre(out) + `abs(${conv(a[0])})`; i = a[1]; }
        } else if (cmd === "placeholder") {
          const a = grupo(s, i);
          if (a) i = a[1];
        } else if (cmd === "pi") out = pre(out) + "(pi)";
        else if (cmd === "exponentialE") out = pre(out) + "(e)";
        else if (cmd === "imaginaryI") out = pre(out) + "(i)";
        else if (cmd === "cdot" || cmd === "times") out += "*";
        else if (cmd === "div") out += "/";
        else if (cmd === "ln") out = pre(out) + "log";
        else if (cmd === "log") out = pre(out) + "log10";
        else if (FUNC.has(cmd)) out = pre(out) + cmd;
        // \left, \right y demás comandos se ignoran
      } else if (c === "^") {
        i++;
        const a = grupo(s, i);
        if (a) { out += `^(${conv(a[0])})`; i = a[1]; }
        else if (s[i] === "\\") { const m = /^\\[a-zA-Z]+/.exec(s.slice(i)); const t = m ? m[0] : ""; out += `^(${conv(t)})`; i += t.length || 1; }
        else if (i < s.length) { out += `^(${s[i]})`; i++; }
      } else if (c === "_") {
        i++;
        const a = grupo(s, i);
        i = a ? a[1] : i + 1;
      } else if (c === "{") {
        const a = grupo(s, i);
        if (a) { out += `(${conv(a[0])})`; i = a[1]; } else i++;
      } else if (c === "}" || c === " ") i++;
      else { out += c; i++; }
    }
    return out;
  };

  const base = latex
    .replace(/\\left\||\\right\|/g, "|")
    .replace(/\|([^|]*)\|/g, "\\abs{$1}");

  return conv(base)
    .replace(/\)\(/g, ")*(")
    .replace(/\)([a-zA-Z0-9])/g, ")*$1")
    .replace(/(?<![a-zA-Z\d.])(\d+\.?\d*)\(/g, "$1*(")
    .replace(/(?<![a-zA-Z])([xei])\(/g, "$1*(")
    .trim();
}