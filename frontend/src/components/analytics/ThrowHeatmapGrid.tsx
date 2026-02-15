/** Displays simplified throw tendency heatmap for training insights. */
export function ThrowHeatmapGrid({ intensity }: { intensity: number[][] }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {intensity.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="h-6 rounded"
            style={{ backgroundColor: `rgba(56, 189, 248, ${Math.min(1, Math.max(0.1, value))})` }}
          />
        )),
      )}
    </div>
  );
}
