/** Renders a minimal SVG line chart for average progression visualization. */
export function AverageTrendChart({ values }: { values: number[] }) {
  const width = 280;
  const height = 120;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full rounded-lg bg-slate-900 p-2">
      <polyline fill="none" stroke="#38BDF8" strokeWidth="3" points={points} />
    </svg>
  );
}
