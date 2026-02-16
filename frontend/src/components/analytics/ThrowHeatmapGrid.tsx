/** Displays labeled heatmap cells so intensity remains interpretable for users. */
export function ThrowHeatmapGrid({ intensity, labels }: { intensity: number[][]; labels?: string[] }) {
  const flat = intensity.flat();
  const max = Math.max(1, ...flat);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1">
        {flat.map((value, index) => {
          const normalized = Math.min(1, Math.max(0.08, value / max));
          return (
            <div
              key={`cell-${index}`}
              className="rounded p-1.5 text-[10px] text-center border border-slate-700"
              style={{ backgroundColor: `rgba(56, 189, 248, ${normalized})` }}
              title={`${labels?.[index] ?? `Feld ${index + 1}`}: ${Math.round(value)}`}
            >
              <div className="font-semibold">{labels?.[index] ?? `F${index + 1}`}</div>
              <div>{Math.round(value)}</div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] muted-text">Legende: höherer Wert = häufiger getroffen.</p>
    </div>
  );
}
