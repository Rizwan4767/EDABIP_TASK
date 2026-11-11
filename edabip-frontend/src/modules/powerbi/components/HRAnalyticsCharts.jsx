/* -------------------------------------------------- */
/* Engagement Score Trend Data                        */
/* -------------------------------------------------- */

export const ENGAGEMENT_DATA = {
  values: [26000, 34000, 30000, 47000, 54000, 50000, 62000, 74000, 80000],
  xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  yLabels: [100000, 75000, 50000, 25000, 0],
  yMax: 100000,
};

/* -------------------------------------------------- */
/* Diversity By Department Data                       */
/* -------------------------------------------------- */

export const DIVERSITY_DATA = [
  { label: 'Engineering', value: 27000, max: 30000, color: '#A0BCE8', bgColor: '#C9DCFC' },
  { label: 'Sales', value: 52000, max: 55000, color: '#7DBBFF', bgColor: '#C6E1FF' },
  { label: 'Marketing', value: 42000, max: 47000, color: '#6BE6D8', bgColor: '#C1FCF5' },
  { label: 'Product', value: 19000, max: 23000, color: '#B899EB', bgColor: '#DCC4FF' },
];

export const DIVERSITY_MAX = 100000;
export const DIVERSITY_YLABELS = [100000, 75000, 50000, 25000, 0];

/* -------------------------------------------------- */
/* Helper: Line Chart Points                          */
/* -------------------------------------------------- */

export function linePathPoints(values, width, height, yMax) {
  const points = linePathDots(values, width, height, yMax);

  if (points.length < 2) {
    return '';
  }

  if (points.length === 2) {
    return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(
      1
    )} L${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }

  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(
      1
    )},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

/* -------------------------------------------------- */
/* Helper: Point coordinates     */
/* -------------------------------------------------- */

export function linePathDots(values, width, height, yMax) {
  const step = width / (values.length - 1);

  return values.map((value, index) => ({
    x: index * step,
    y: height - (value / yMax) * height,
  }));
}