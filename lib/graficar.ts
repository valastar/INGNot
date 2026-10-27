import { getMath, normalizar } from "./math";

export const COLORES = ["#d97757", "#6a9bcc", "#788c5d"];

// Dibuja hasta 3 funciones de x en un canvas (cuadrícula, ejes y rango Y automático)
export async function dibujarGrafica(
  c: HTMLCanvasElement,
  fns: string[],
  xmin: number,
  xmax: number,
  colores?: string[],
) {
  const math = await getMath();
  const dpr = window.devicePixelRatio || 1;
  const W = c.clientWidth,
    H = c.clientHeight;
  if (!W || !H || !(xmax > xmin)) return;
  c.width = W * dpr;
  c.height = H * dpr;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.clearRect(0, 0, W, H);

  const compiladas = fns.map((f) => {
    if (!f.trim()) return null;
    try {
      return math.compile(normalizar(f));
    } catch {
      return null;
    }
  });
  const N = Math.min(800, Math.floor(W));
  const series = compiladas.map((fn) => {
    if (!fn) return null;
    const pts: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = xmin + ((xmax - xmin) * i) / N;
      let y = NaN;
      try {
        const r = fn.evaluate({ x });
        y = typeof r === "number" ? r : NaN;
      } catch {}
      pts.push(y);
    }
    return pts;
  });
  const todos = series
    .flat()
    .filter((v): v is number => typeof v === "number" && isFinite(v))
    .sort((a, b) => a - b);
  let ymin = -5,
    ymax = 5;
  if (todos.length) {
    ymin = todos[Math.floor(todos.length * 0.02)];
    ymax = todos[Math.ceil(todos.length * 0.98) - 1];
    if (ymax - ymin < 1e-6) {
      ymin -= 1;
      ymax += 1;
    }
    const pad = (ymax - ymin) * 0.1;
    ymin -= pad;
    ymax += pad;
  }
  const X = (x: number) => ((x - xmin) / (xmax - xmin)) * W;
  const Y = (y: number) => H - ((y - ymin) / (ymax - ymin)) * H;
  const paso = (r: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(r / 8)));
    return [1, 2, 5, 10].map((m) => m * p).find((s) => r / s <= 10) ?? p;
  };

  g.font = "11px ui-sans-serif";
  g.fillStyle = "#9a958c";
  g.strokeStyle = "#3b3936";
  g.lineWidth = 1;
  const sx = paso(xmax - xmin),
    sy = paso(ymax - ymin);
  for (let x = Math.ceil(xmin / sx) * sx; x <= xmax; x += sx) {
    g.beginPath();
    g.moveTo(X(x), 0);
    g.lineTo(X(x), H);
    g.stroke();
    g.fillText(
      +x.toFixed(6) + "",
      X(x) + 3,
      Math.min(H - 4, Math.max(12, Y(0) + 12)),
    );
  }
  for (let y = Math.ceil(ymin / sy) * sy; y <= ymax; y += sy) {
    g.beginPath();
    g.moveTo(0, Y(y));
    g.lineTo(W, Y(y));
    g.stroke();
    g.fillText(
      +y.toFixed(6) + "",
      Math.min(W - 30, Math.max(3, X(0) + 4)),
      Y(y) - 3,
    );
  }
  g.strokeStyle = "#ece9e2";
  g.lineWidth = 1.5;
  if (xmin < 0 && xmax > 0) {
    g.beginPath();
    g.moveTo(X(0), 0);
    g.lineTo(X(0), H);
    g.stroke();
  }
  if (ymin < 0 && ymax > 0) {
    g.beginPath();
    g.moveTo(0, Y(0));
    g.lineTo(W, Y(0));
    g.stroke();
  }

  series.forEach((pts, k) => {
    if (!pts) return;
    g.strokeStyle = colores?.[k] ?? COLORES[k];
    g.lineWidth = 2;
    g.beginPath();
    let abierto = false;
    pts.forEach((y, i) => {
      if (!isFinite(y) || Math.abs(y) > 1e6) {
        abierto = false;
        return;
      }
      const px = X(xmin + ((xmax - xmin) * i) / N),
        py = Y(y);
      if (!abierto) {
        g.moveTo(px, py);
        abierto = true;
      } else g.lineTo(px, py);
    });
    g.stroke();
  });
}
