export type Formula = { cat: string; nombre: string; f: string };

export const FORMULAS: Formula[] = [
  // Cálculo
  { cat: "Cálculo", nombre: "Definición de derivada", f: "f′(x) = lim(h→0) [f(x+h) − f(x)] / h" },
  { cat: "Cálculo", nombre: "Regla del producto", f: "(uv)′ = u′v + uv′" },
  { cat: "Cálculo", nombre: "Regla del cociente", f: "(u/v)′ = (u′v − uv′) / v²" },
  { cat: "Cálculo", nombre: "Regla de la cadena", f: "d/dx f(g(x)) = f′(g(x))·g′(x)" },
  { cat: "Cálculo", nombre: "Derivadas básicas", f: "(xⁿ)′ = n·xⁿ⁻¹ ; (eˣ)′ = eˣ ; (ln x)′ = 1/x ; (sen x)′ = cos x ; (cos x)′ = −sen x" },
  { cat: "Cálculo", nombre: "Integración por partes", f: "∫u dv = uv − ∫v du" },
  { cat: "Cálculo", nombre: "Integrales básicas", f: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C ; ∫eˣ dx = eˣ + C ; ∫1/x dx = ln|x| + C" },
  { cat: "Cálculo", nombre: "Teorema fundamental", f: "∫ₐᵇ f(x) dx = F(b) − F(a)" },
  { cat: "Cálculo", nombre: "Serie de Taylor", f: "f(x) = Σ f⁽ⁿ⁾(a)/n! · (x − a)ⁿ" },
  { cat: "Cálculo", nombre: "L'Hôpital", f: "lim f/g = lim f′/g′  (forma 0/0 o ∞/∞)" },
  // Álgebra y trigonometría
  { cat: "Álgebra", nombre: "Fórmula general", f: "x = (−b ± √(b² − 4ac)) / 2a" },
  { cat: "Álgebra", nombre: "Binomio de Newton", f: "(a+b)ⁿ = Σ C(n,k)·aⁿ⁻ᵏ·bᵏ" },
  { cat: "Álgebra", nombre: "Logaritmos", f: "log(ab) = log a + log b ; log(aⁿ) = n·log a ; logₐ b = ln b / ln a" },
  { cat: "Álgebra", nombre: "Identidad pitagórica", f: "sen²θ + cos²θ = 1" },
  { cat: "Álgebra", nombre: "Ángulo doble", f: "sen 2θ = 2 sen θ cos θ ; cos 2θ = cos²θ − sen²θ" },
  { cat: "Álgebra", nombre: "Euler", f: "e^(iθ) = cos θ + i sen θ" },
  // Álgebra lineal
  { cat: "Álgebra lineal", nombre: "Determinante 2×2", f: "det [a b; c d] = ad − bc" },
  { cat: "Álgebra lineal", nombre: "Inversa 2×2", f: "A⁻¹ = 1/(ad − bc) · [d −b; −c a]" },
  { cat: "Álgebra lineal", nombre: "Valores propios", f: "det(A − λI) = 0" },
  { cat: "Álgebra lineal", nombre: "Producto punto", f: "a·b = |a||b| cos θ = a₁b₁ + a₂b₂ + a₃b₃" },
  { cat: "Álgebra lineal", nombre: "Regla de Cramer", f: "xᵢ = det(Aᵢ) / det(A)" },
  // Física
  { cat: "Física", nombre: "MRUA", f: "v = v₀ + at ; x = x₀ + v₀t + ½at² ; v² = v₀² + 2a·Δx" },
  { cat: "Física", nombre: "Segunda ley de Newton", f: "ΣF = m·a" },
  { cat: "Física", nombre: "Energía", f: "Ec = ½mv² ; Ep = mgh ; W = F·d·cos θ" },
  { cat: "Física", nombre: "Momento lineal", f: "p = m·v ; J = Δp = F·Δt" },
  { cat: "Física", nombre: "Ley de Coulomb", f: "F = k·q₁q₂ / r²  (k ≈ 8.99×10⁹ N·m²/C²)" },
  { cat: "Física", nombre: "Gravitación universal", f: "F = G·m₁m₂ / r²  (G ≈ 6.674×10⁻¹¹)" },
  { cat: "Física", nombre: "Gas ideal", f: "P·V = n·R·T  (R ≈ 8.314 J/mol·K)" },
  // Circuitos
  { cat: "Circuitos", nombre: "Ley de Ohm", f: "V = I·R" },
  { cat: "Circuitos", nombre: "Potencia eléctrica", f: "P = V·I = I²R = V²/R" },
  { cat: "Circuitos", nombre: "Resistencias", f: "Serie: Rₜ = R₁ + R₂ + … ; Paralelo: 1/Rₜ = 1/R₁ + 1/R₂ + …" },
  { cat: "Circuitos", nombre: "Leyes de Kirchhoff", f: "ΣI(nodo) = 0 ; ΣV(malla) = 0" },
  { cat: "Circuitos", nombre: "Capacitor / Inductor", f: "i = C·dv/dt ; v = L·di/dt ; τ = RC" },
  { cat: "Circuitos", nombre: "Impedancia", f: "Z_R = R ; Z_L = jωL ; Z_C = 1/(jωC)" },
  // Estadística
  { cat: "Estadística", nombre: "Media y varianza", f: "x̄ = Σxᵢ/n ; s² = Σ(xᵢ − x̄)²/(n − 1)" },
  { cat: "Estadística", nombre: "Distribución normal", f: "f(x) = 1/(σ√(2π)) · e^(−(x−μ)²/(2σ²))" },
  { cat: "Estadística", nombre: "Probabilidad condicional", f: "P(A|B) = P(A∩B) / P(B)  ; Bayes: P(A|B) = P(B|A)P(A)/P(B)" },
  // Mate discreta
  { cat: "Mate discreta", nombre: "Combinaciones y permutaciones", f: "C(n,k) = n!/(k!(n−k)!) ; P(n,k) = n!/(n−k)!" },
  { cat: "Mate discreta", nombre: "De Morgan", f: "¬(p ∧ q) ⇔ ¬p ∨ ¬q ; ¬(p ∨ q) ⇔ ¬p ∧ ¬q" },
  { cat: "Mate discreta", nombre: "Inclusión-exclusión", f: "|A ∪ B| = |A| + |B| − |A ∩ B|" },
];

export const CATEGORIAS = Array.from(new Set(FORMULAS.map((x) => x.cat)));
