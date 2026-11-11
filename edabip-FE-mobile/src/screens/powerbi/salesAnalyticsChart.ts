/**
 * Data-driven chart math for Sales Analytics.
 *
 * Paths and scales are computed from the payload so the graphs update when
 * the backend (or the current mock) sends a different series. Web Sales
 * Analytics uses the same daily USD series and monthly thousands-or-USD bars.
 */

export type PlotPoint = { x: number; y: number };

export function salesUsdTick(value: number): string {
  if (value <= 0) {
    return '0';
  }
  const thousands = value / 1000;
  if (Number.isInteger(thousands)) {
    return `$${thousands}K`;
  }
  return `$${thousands.toFixed(1)}K`;
}

/** Tick labels for values already expressed in thousands (financial YTD). */
export function thousandsUsdTick(value: number): string {
  if (value <= 0) {
    return '0';
  }
  return `$${value}K`;
}

export function salesBarLabel(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** Treat values under 500 as thousands (web monthly mock) so both contracts plot. */
export function usdFromMaybeThousands(values: number[]): (value: number) => number {
  const max = Math.max(0, ...values);
  const scale = max > 0 && max < 500 ? 1000 : 1;
  return (value) => value * scale;
}

export function dailyRevenueScale(maxValue: number): { max: number; ticks: number[] } {
  if (maxValue <= 30000) {
    return { max: 30000, ticks: [30000, 20000, 10000, 0] };
  }
  const step = 10000;
  const max = Math.ceil((maxValue * 1.08) / step) * step;
  const ticks: number[] = [];
  for (let value = max; value >= 0; value -= step) {
    ticks.push(value);
  }
  return { max, ticks };
}

export function monthlyRevenueScale(maxValue: number): { max: number; ticks: number[] } {
  if (maxValue <= 100000) {
    return { max: 100000, ticks: [100000, 75000, 50000, 25000, 0] };
  }
  const padded = maxValue * 1.1;
  const rawStep = padded / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = niceResidual * magnitude;
  const max = step * 4;
  return {
    max,
    ticks: [max, max - step, max - step * 2, max - step * 3, 0],
  };
}

export function plotY(value: number, max: number, height: number): number {
  if (max <= 0) {
    return height;
  }
  return height - (Math.max(0, value) / max) * height;
}

/** Catmull-Rom spline through every point so the line follows the series, not a hardcoded path. */
export function smoothLinePath(points: PlotPoint[]): string {
  const start = points[0];
  if (!start) {
    return '';
  }
  if (points.length === 1) {
    return `M ${start.x} ${start.y}`;
  }

  let path = `M ${start.x} ${start.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p1 = points[index];
    const p2 = points[index + 1];
    if (!p1 || !p2) {
      continue;
    }
    const p0 = points[index - 1] ?? p1;
    const p3 = points[index + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return path;
}

export function uniqueDayLabels(
  days: string[],
  xForIndex: (index: number) => number,
): { label: string; x: number }[] {
  const groups = new Map<string, number[]>();
  days.forEach((day, index) => {
    const xs = groups.get(day) ?? [];
    xs.push(xForIndex(index));
    groups.set(day, xs);
  });
  return [...groups.entries()].map(([label, xs]) => {
    const first = xs[0] ?? 0;
    const last = xs[xs.length - 1] ?? first;
    return { label, x: (first + last) / 2 };
  });
}
