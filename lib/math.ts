// Utilidades de cálculo (mathjs se carga bajo demanda para no inflar el bundle inicial)
export const getMath = () => import("mathjs");

// Convierte símbolos Unicode comunes a sintaxis que entiende mathjs
export function normalizar(expr: string): string {
  return expr
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/√\s*([0-9.]+|[a-zA-Z]\w*)/g, "sqrt($1)")
    .replace(/∛\s*\(/g, "cbrt(")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/°/g, " deg")
    .replace(/\s+/g, " ")
    .trim();
}

export async function evaluar(expr: string, scope: Record<string, unknown> = {}): Promise<string> {
  const math = await getMath();
  const res = math.evaluate(normalizar(expr), scope);
  if (res === undefined || typeof res === "function") throw new Error("Sin resultado");
  return math.format(res, { precision: 10, lowerExp: -6, upperExp: 9 });
}
