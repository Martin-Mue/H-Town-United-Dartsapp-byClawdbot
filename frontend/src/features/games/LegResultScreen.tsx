import { WinnerBanner } from '../../components/game/WinnerBanner';

/** Shows a leg completion moment with leg-level statistics snapshot. */
export function LegResultScreen() {
  return (
    <section className="space-y-3">
      <WinnerBanner text="Leg won by Player One" />
      <div className="rounded-2xl bg-panel p-4">
        <h3 className="font-semibold">Leg Statistics</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          <li>3-dart average: 71.22</li>
          <li>Checkout: D16 (2 darts)</li>
          <li>Highest turn: 140</li>
        </ul>
      </div>
    </section>
  );
}
