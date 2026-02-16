import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';
import { computePlayerRankingStats, type HistoryEntry, type ManagedPlayer } from '../statistics/rankingUtils';

type TournamentStateLite = { championPlayerId: string | null; isCompleted: boolean };

type RecentMatch = HistoryEntry;
const SCORING_BUCKETS = [45, 60, 80, 100, 120, 140, 160, 180] as const;

export function PlayerProfilePage() {
  const { playerId = '' } = useParams();
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [tournaments, setTournaments] = useState<TournamentStateLite[]>([]);
  const [elo, setElo] = useState<Array<{ playerId: string; rating: number }>>([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState<{ nickname: string; nicknamePronunciation: string; throwingArm: 'RIGHT' | 'LEFT' | 'BOTH'; gripStyle: string; dartWeightGrams: string; seasonsPlayed: string; announcerStyle: 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR'; introAnnouncementEnabled: boolean }>({ nickname: '', nicknamePronunciation: '', throwingArm: 'RIGHT', gripStyle: '', dartWeightGrams: '', seasonsPlayed: '0', announcerStyle: 'ARENA', introAnnouncementEnabled: true });
  const [trendWindow, setTrendWindow] = useState<'5' | '10' | 'all'>('10');
  const [trendMode, setTrendMode] = useState<'match' | 'mixed'>('match');

  const players = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);


  const player = players.find((p) => p.id === playerId);

  useEffect(() => {
    if (!player) return;
    setBioDraft({
      nickname: player.nickname ?? '',
      nicknamePronunciation: player.nicknamePronunciation ?? '',
      throwingArm: (player.throwingArm ?? 'RIGHT') as 'RIGHT' | 'LEFT' | 'BOTH',
      gripStyle: player.gripStyle ?? '',
      dartWeightGrams: player.dartWeightGrams ? String(player.dartWeightGrams) : '',
      seasonsPlayed: String(player.seasonsPlayed ?? 0),
      announcerStyle: (player.announcerStyle ?? 'ARENA') as 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR',
      introAnnouncementEnabled: player.introAnnouncementEnabled ?? true,
    });
  }, [player]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('htown-match-history');
      setRecentMatches(raw ? (JSON.parse(raw) as RecentMatch[]) : []);
    } catch {
      setRecentMatches([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [tournamentRes, rankingRes] = await Promise.all([
          fetch('http://localhost:8080/api/tournaments'),
          fetch('http://localhost:8080/api/global-ranking'),
        ]);
        if (!tournamentRes.ok || !rankingRes.ok) return;
        setTournaments((await tournamentRes.json()) as TournamentStateLite[]);
        setElo(((await rankingRes.json()) as { ranking: Array<{ playerId: string; rating: number }> }).ranking);
      } catch {
        // best effort
      }
    };
    void load();
  }, []);

  const trend = useMemo(() => {
    if (!player) return [42, 46, 49, 53, 55];

    const sorted = [...recentMatches]
      .filter((m) => m.players.some((p) => p.id === player.id || p.name === player.displayName))
      .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

    const values = sorted.map((match) => {
      const turns = match.playerTurnScores?.[player.id] ?? [];
      if (turns.length === 0) return null;
      const avg = turns.reduce((acc, v) => acc + v, 0) / turns.length;
      return Math.max(10, Math.min(120, Number(avg.toFixed(1))));
    }).filter((v): v is number => v !== null);

    const limited = trendWindow === 'all'
      ? values
      : values.slice(-Number(trendWindow));

    if (limited.length > 1) return limited;
    const base = player.currentAverage ?? 45;
    return trendMode === 'mixed'
      ? [base - 6, base - 3, base, base + 1, base + 2].map((v) => Math.max(20, Math.round(v)))
      : [base - 4, base - 2, base, base + 1, base + 1].map((v) => Math.max(20, Math.round(v)));
  }, [player, recentMatches, trendWindow, trendMode]);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return computePlayerRankingStats([player], elo, recentMatches, tournaments)[0] ?? null;
  }, [player, elo, recentMatches, tournaments]);

  const personalMatches = recentMatches.filter((m) => m.players.some((p) => p.id === player?.id || p.name === player?.displayName));


  const personalScoringDistribution = useMemo(() => {
    if (!player) return SCORING_BUCKETS.map((bucket) => ({ bucket, hits: 0 }));
    const turns = personalMatches.flatMap((m) => m.playerTurnScores?.[player.id] ?? []);
    const countAtLeast = (threshold: number) => turns.filter((value) => value >= threshold).length;
    return SCORING_BUCKETS.map((bucket) => ({ bucket, hits: countAtLeast(bucket) }));
  }, [personalMatches, player]);

  const heatLabels = ['45+', '60+', '80+', '100+', '120+', '140+', '160+', '180'];
  const heat = useMemo(() => {
    const values = personalScoringDistribution.map((row) => row.hits);
    return [values.slice(0, 4), values.slice(4, 8)];
  }, [personalScoringDistribution]);


  if (!player) return <p className="card-bg rounded-xl p-4">Spielerprofil nicht gefunden.</p>;

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <p className="text-xs muted-text">Spielerprofil</p>
        <h2 className="text-2xl uppercase">{player.displayName}</h2>
        <p className="text-xs muted-text mt-1">{player.membershipStatus === 'TRIAL' ? 'Schnuppermodus' : 'Vereinsmitglied'}</p>
      </div>


      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase">Spieler-Steckbrief</h3>
          <button onClick={() => setIsEditingBio((v) => !v)} className="rounded bg-slate-800 px-2 py-1 text-[11px]">{isEditingBio ? 'Fertig' : 'Bearbeiten'}</button>
        </div>

        {!isEditingBio ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat title="Spitzname" value={String(player.nickname ?? '—')} />
            <Stat title="Wurfarm" value={String(player.throwingArm === 'LEFT' ? 'Links' : player.throwingArm === 'BOTH' ? 'Beidseitig' : player.throwingArm ? 'Rechts' : '—')} />
            <Stat title="Gripart" value={String(player.gripStyle ?? '—')} />
            <Stat title="Dartgewicht" value={player.dartWeightGrams ? `${player.dartWeightGrams} g` : '—'} />
            <Stat title="Gespielte Saisons" value={String(player.seasonsPlayed ?? 0)} />
            <Stat title="Ansage" value={player.introAnnouncementEnabled ? 'AN' : 'AUS'} />
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <input value={bioDraft.nickname} onChange={(e) => setBioDraft((d) => ({ ...d, nickname: e.target.value }))} placeholder="Spitzname" className="w-full rounded bg-slate-800 p-2" />
            <input value={bioDraft.nicknamePronunciation} onChange={(e) => setBioDraft((d) => ({ ...d, nicknamePronunciation: e.target.value }))} placeholder="Aussprache (frei)" className="w-full rounded bg-slate-800 p-2" />
            <div className="grid grid-cols-2 gap-2">
              <select value={bioDraft.throwingArm} onChange={(e) => setBioDraft((d) => ({ ...d, throwingArm: e.target.value as 'RIGHT' | 'LEFT' | 'BOTH' }))} className="rounded bg-slate-800 p-2">
                <option value="RIGHT">Rechts</option>
                <option value="LEFT">Links</option>
                <option value="BOTH">Beidseitig</option>
              </select>
              <input value={bioDraft.gripStyle} onChange={(e) => setBioDraft((d) => ({ ...d, gripStyle: e.target.value }))} placeholder="Gripart" className="rounded bg-slate-800 p-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={bioDraft.dartWeightGrams} onChange={(e) => setBioDraft((d) => ({ ...d, dartWeightGrams: e.target.value }))} placeholder="Dartgewicht g" className="rounded bg-slate-800 p-2" />
              <input type="number" value={bioDraft.seasonsPlayed} onChange={(e) => setBioDraft((d) => ({ ...d, seasonsPlayed: e.target.value }))} placeholder="Saisons" className="rounded bg-slate-800 p-2" />
            </div>
            <select value={bioDraft.announcerStyle} onChange={(e) => setBioDraft((d) => ({ ...d, announcerStyle: e.target.value as 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR' }))} className="w-full rounded bg-slate-800 p-2">
              <option value="ARENA">Arena</option>
              <option value="CLASSIC">Classic Caller</option>
              <option value="HYPE">Hype</option>
              <option value="COOL">Cool & clean</option>
              <option value="INTIMIDATOR">Intimidator</option>
            </select>
            <button onClick={() => setBioDraft((d) => ({ ...d, introAnnouncementEnabled: !d.introAnnouncementEnabled }))} className="w-full rounded bg-slate-800 p-2 text-left flex items-center justify-between"><span>Matchstart-Ansage</span><span className={bioDraft.introAnnouncementEnabled ? 'text-emerald-300' : 'text-slate-400'}>{bioDraft.introAnnouncementEnabled ? 'AN' : 'AUS'}</span></button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => previewAnnouncement(player.displayName, bioDraft.nickname, bioDraft.nicknamePronunciation, bioDraft.announcerStyle)} className="rounded bg-slate-800 p-2">Ansage testen</button>
              <button
                onClick={() => {
                  const raw = window.localStorage.getItem('htown-players');
                  if (!raw) return;
                  const all = JSON.parse(raw) as ManagedPlayer[];
                  const updated = all.map((pl) => pl.id === player.id ? {
                    ...pl,
                    nickname: bioDraft.nickname.trim() || undefined,
                    nicknamePronunciation: bioDraft.nicknamePronunciation.trim() || undefined,
                    throwingArm: bioDraft.throwingArm,
                    gripStyle: bioDraft.gripStyle.trim() || undefined,
                    dartWeightGrams: bioDraft.dartWeightGrams ? Number(bioDraft.dartWeightGrams) : undefined,
                    seasonsPlayed: Number(bioDraft.seasonsPlayed || 0),
                    announcerStyle: bioDraft.announcerStyle,
                    introAnnouncementEnabled: bioDraft.introAnnouncementEnabled,
                  } : pl);
                  window.localStorage.setItem('htown-players', JSON.stringify(updated));
                  window.location.reload();
                }}
                className="rounded bg-sky-400 text-slate-900 font-semibold p-2"
              >Speichern</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat title="3-Dart Average" value={String(player.currentAverage ?? 0)} />
        <Stat title="Checkout-Quote (%)" value={String(player.checkoutPercentage ?? 0)} />
        <Stat title="Pressure-Index (0-100)" value={String(player.pressurePerformanceIndex ?? 0)} />
        <Stat title="180er gesamt" value={String(player.total180s ?? 0)} />
      </div>

      {playerStats && (
        <div className="rounded-2xl card-bg border soft-border p-4">
          <h3 className="text-sm uppercase mb-2">Ehrungen & Gamefication</h3>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat title="ELO" value={String(playerStats.elo)} />
            <Stat title="Turniersiege" value={String(playerStats.tournamentWins)} />
            <Stat title="Einzelsiege" value={String(playerStats.matchWins)} />
            <Stat title="Beste Siegesserie" value={String(playerStats.bestWinStreak)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {playerStats.badges.length > 0 ? playerStats.badges.map((badge) => (
              <span key={badge} className="rounded-full px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-fuchsia-500/30 to-cyan-400/30 border border-cyan-300/40">
                🏅 {badge}
              </span>
            )) : <p className="text-xs muted-text">Noch keine Badges — nächstes Turnier wartet.</p>}
          </div>
        </div>
      )}


      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Scoring-Klassen (Match, persistent)</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {personalScoringDistribution.map((row) => (
            <div key={row.bucket} className="rounded bg-slate-800 p-2 flex items-center justify-between">
              <span>{row.bucket === 180 ? '180' : `${row.bucket}+`}</span>
              <span className="primary-text font-semibold">{row.hits}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm uppercase">Trendlinie Trefferbilanz</h3>
          <div className="flex gap-1">
            <select value={trendMode} onChange={(e) => setTrendMode(e.target.value as 'match' | 'mixed')} className="rounded bg-slate-800 p-1 text-[11px]">
              <option value="match">Nur Matchdaten</option>
              <option value="mixed">Match + Profilmix</option>
            </select>
            <select value={trendWindow} onChange={(e) => setTrendWindow(e.target.value as '5' | '10' | 'all')} className="rounded bg-slate-800 p-1 text-[11px]">
              <option value="5">letzte 5</option>
              <option value="10">letzte 10</option>
              <option value="all">alle</option>
            </select>
          </div>
        </div>
        <p className="text-xs muted-text mb-2">Zeigt die Entwicklung des 3-Dart-Average (höher = besser).</p>
        <AverageTrendChart values={trend} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Treffer-Heatmap</h3>
        <p className="text-xs muted-text mb-2">Nachvollziehbare Häufigkeit je Scoring-Klasse (Matchdaten).</p>
        <ThrowHeatmapGrid intensity={heat} labels={heatLabels} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Gespielte Spiele & Ergebnisse</h3>
        <div className="space-y-2 text-xs">
          {personalMatches.map((m) => (
            <div key={m.id} className="rounded bg-slate-800 p-2">
              <p>{m.players.map((p) => p.name).join(' vs ')} · {m.mode.replace('_', ' ')}</p>
              <p className="muted-text mt-1">{new Date(m.playedAt).toLocaleString('de-DE')} · {m.resultLabel}</p>
              <p className="primary-text mt-1">Sieger: {m.winnerName ?? m.winnerPlayerId ?? '—'}</p>
            </div>
          ))}
          {personalMatches.length === 0 && <p className="muted-text">Noch keine Matches in der Historie.</p>}
        </div>
      </div>

      <Link to="/statistics" className="block w-full rounded-xl bg-slate-800 p-3 text-sm text-center">Zurück zu Statistiken</Link>
    </section>
  );
}

function previewAnnouncement(name: string, nickname?: string, pronunciation?: string, style: 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR' = 'ARENA') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const nickPart = nickname ? ` \"${(pronunciation || nickname)}\"` : '';
  const line = style === 'HYPE'
    ? `Make some noise! ${name}${nickPart} am Oche!`
    : style === 'CLASSIC'
      ? `Nächster Spieler: ${name}${nickPart}`
      : style === 'COOL'
        ? `${name}${nickPart} is ready.`
        : style === 'INTIMIDATOR'
          ? `Now entering: ${name}${nickPart}`
          : `Auftritt für ${name}${nickPart}`;
  const utterance = new SpeechSynthesisUtterance(line);
  utterance.rate = style === 'HYPE' ? 1.05 : style === 'CLASSIC' ? 0.9 : 0.95;
  utterance.pitch = style === 'INTIMIDATOR' ? 0.8 : 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function Stat({ title, value }: { title: string; value: string }) {
  return <article className="rounded-xl card-bg border soft-border p-3"><p className="muted-text">{title}</p><p className="text-xl font-semibold">{value}</p></article>;
}
