# My Note web — MVP para estudiantes de ingeniería

Next.js 16 · React 19 · Tailwind 4 · Tiptap 3 · Supabase · mathjs

## Novedades de este MVP
- **Editor con atajos de cálculo**: `Ctrl+Enter` calcula la línea (o selección) y escribe `= resultado`; soporta variables por nota (`a = 3`), grados (`sin(30 deg)`), matrices, complejos y unidades.
- **Autoconversión de símbolos al escribir**: `->` → `→`, `<=` → `≤`, `!=` → `≠`, `x^2␣` → `x²`, `x_1␣` → `x₁`, `\alpha␣` → `α`, `\sqrt␣` → `√`, `\int␣` → `∫`…
- **Panel de símbolos ampliado** (Cálculo, Álgebra, Mate discretas, Física, Figuras) + pestaña **Fórmulas** que inserta fórmulas en la nota.
- **/herramientas**: calculadora científica, graficador (3 funciones, zoom con rueda), matrices (det, inversa, A·B, valores propios, Ax=b), ecuación cuadrática, conversor de unidades, bases numéricas y estadística descriptiva.
- **/formulario**: fórmulas de cálculo, álgebra, álgebra lineal, física, circuitos, estadística y mate discreta (clic para copiar).
- **/calendario**: exámenes, entregas y pendientes con vista mensual y cuenta regresiva.
- Home con 6 secciones. Libros sigue como "Próximamente".

## Cómo correrlo
```bash
npm install
cp .env.example .env.local   # llena tus llaves de Supabase y Gemini
npm run dev
```

## Base de datos
Para el Calendario ejecuta `supabase/schema.sql` en el SQL Editor de Supabase (crea la tabla `eventos` con RLS). Las tablas `clases`, `notas` y `archivos` y el bucket `archivos` son los que ya tenías.

## Estructura nueva
```
app/herramientas  app/formulario  app/calendario
components/atajos.ts          ← reglas de autoconversión
components/tools/*            ← calculadora, graficador, matrices, mini-herramientas
lib/math.ts  lib/formulas.ts  lib/useEventos.ts
```
