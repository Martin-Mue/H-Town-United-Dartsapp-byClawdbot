/** Renders a centered SVG line chart with legend and helper grid for average progression. */
export function AverageTrendChart({ values }: { values: number[] }) {
  const width = 320;
  const height = 150;
  const paddingX = 20;
  const paddingY = 18;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);

  const xFor = (index: number) => paddingX + (index / Math.max(values.length - 1, 1)) * (width - paddingX * 2);
  const yFor = (value: number) => height - paddingY - ((value - min) / span) * (height - paddingY * 2);

  const points = values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');

  const ticks = [0, 0.5, 1].map((t) => Number((min + span * t).toFixed(1)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] muted-text px-1">
        <span>Min: {Math.min(...values).toFixed(1)}</span>
        <span>Trend · 3-Dart Average</span>
        <span>Max: {Math.max(...values).toFixed(1)}</span>
      </div>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full max-w-[340px] rounded-lg bg-slate-900 p-2">
          {[0, 0.5, 1].map((t) => {
            const y = paddingY + t * (height - paddingY * 2);
            return <line key={`g-${t}`} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(148,163,184,.25)" strokeDasharray="4 4" />;
          })}

          {ticks.map((tick, idx) => {
            const y = yFor(tick);
            return <text key={`t-${idx}`} x={4} y={y + 4} fontSize="9" fill="#94A3B8">{tick}</text>;
          })}

          <polyline fill="none" stroke="#38BDF8" strokeWidth="3" points={points} />
          {values.map((value, index) => (
            <circle key={`p-${index}`} cx={xFor(index)} cy={yFor(value)} r={2.8} fill="#22D3EE" />
          ))}
        </svg>
      </div>
      <p className="text-[11px] muted-text">Legende: Steigende Linie = besserer Schnitt, fallende Linie = Formabfall.</p>
    </div>
  );
}
