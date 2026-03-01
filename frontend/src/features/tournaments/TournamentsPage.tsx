import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentBracket, type TournamentRound } from '../../components/tournament/TournamentBracket';
import { GameApiClient } from '../../services/GameApiClient';
import { TournamentApiClient, type RoundMode, type TournamentFormat, type TournamentStateDto, type ByePlacement, type SeedingMode } from '../../services/TournamentApiClient';

const tournamentApiClient = new TournamentApiClient('http://localhost:8080');
const gameApiClient = new GameApiClient('http://localhost:8080');

type ManagedPlayer = {
  id: string;
  displayName: string;
  membershipStatus: 'CLUB_MEMBER' | 'TRIAL';
  preferredCheckoutMode: 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
};

export function TournamentsPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentStateDto[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [name, setName] = useState('H-Town Cup');
  const [format, setFormat] = useState<TournamentFormat>('SINGLE_ELIMINATION');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [byePlacement, setByePlacement] = useState<ByePlacement>('ROUND_1');
  const [seedingMode, setSeedingMode] = useState<SeedingMode>('RANDOM');
  const [defaultLegsPerSet, setDefaultLegsPerSet] = useState(3);
  const [defaultSetsToWin, setDefaultSetsToWin] = useState(2);
  const [allowRoundModeSwitch, setAllowRoundModeSwitch] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clubPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const selectedTournament = useMemo(
    () => tournaments.find((entry) => entry.tournamentId === selectedTournamentId) ?? tournaments[0],
    [selectedTournamentId, tournaments],
  );

  const rounds: TournamentRound[] = (selectedTournament?.rounds ?? []).map((round) => ({
    roundNumber: round.roundNumber,
    mode: round.mode,
    matches: round.fixtures,
  }));

  const participantsDraft = useMemo(() => [...selectedMembers, ...guestPlayers], [selectedMembers, guestPlayers]);

  const tournamentPreview = useMemo(() =>
    buildTournamentPreview(participantsDraft, format, ['X01_501', 'X01_501', 'X01_501'], byePlacement),
    [participantsDraft, format, byePlacement],
  );

  const refresh = async () => {
    try {
      setErrorMessage(null);
      const data = await tournamentApiClient.listTournaments();
      setTournaments(data);
      if (!selectedTournamentId && data.length > 0) setSelectedTournamentId(data[0].tournamentId);
    } catch {
      setErrorMessage('Tournament backend unavailable.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const toggleMember = (nameToToggle: string) => {
    setSelectedMembers((prev) => prev.includes(nameToToggle) ? prev.filter((entry) => entry !== nameToToggle) : [...prev, nameToToggle]);
  };

  const addGuest = () => {
    const trimmed = guestName.trim();
    if (!trimmed || guestPlayers.includes(trimmed)) return;
    setGuestPlayers((prev) => [...prev, trimmed]);
    setGuestName('');
  };

  const createTournament = async () => {
    const participants = [...selectedMembers, ...guestPlayers];
    if (participants.length < 2) return setErrorMessage('Mindestens 2 Teilnehmer angeben.');

    try {
      setErrorMessage(null);
      const created = await tournamentApiClient.createTournament({
        name: name.trim() || 'H-Town Cup',
        format,
        participants,
        roundModes: ['X01_501', 'X01_501', 'X01_501'],
        settings: { byePlacement, seedingMode, defaultLegsPerSet, defaultSetsToWin, allowRoundModeSwitch },
      });

      await refresh();
      setSelectedTournamentId(created.tournamentId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Turnier konnte nicht erstellt werden.');
    }
  };

  const setRoundMode = async (roundNumber: number, mode: RoundMode) => {
    if (!selectedTournament) return;
    const updated = await tournamentApiClient.setRoundMode(selectedTournament.tournamentId, roundNumber, mode);
    setTournaments((prev) => prev.map((entry) => (entry.tournamentId === updated.tournamentId ? updated : entry)));
  };

  const onSelectWinner = async (roundNumber: number, fixtureIndex: number, winner: string, resultLabel?: string) => {
    if (!selectedTournament) return;
    const updated = await tournamentApiClient.recordWinner(selectedTournament.tournamentId, roundNumber, fixtureIndex, winner, resultLabel);
    setTournaments((prev) => prev.map((entry) => (entry.tournamentId === updated.tournamentId ? updated : entry)));
  };

  const onStartMatch = async (roundNumber: number, fixtureIndex: number) => {
    if (!selectedTournament) return;
    const fixture = selectedTournament.rounds.find((r) => r.roundNumber === roundNumber)?.fixtures[fixtureIndex];
    if (!fixture) return;
    if (fixture.linkedMatchId || fixture.winnerPlayerId) return setErrorMessage('Fixture ist bereits verknüpft oder abgeschlossen.');
    if ([fixture.homePlayerId, fixture.awayPlayerId].some((p) => p === 'BYE' || p === 'TBD')) return setErrorMessage('Fixture ist noch nicht startbereit.');

    const home = clubPlayers.find((p) => p.displayName === fixture.homePlayerId);
    const away = clubPlayers.find((p) => p.displayName === fixture.awayPlayerId);

    const created = await gameApiClient.createMatch({
      mode: selectedTournament.rounds.find((r) => r.roundNumber === roundNumber)?.mode ?? 'X01_501',
      legsPerSet: selectedTournament.settings.defaultLegsPerSet,
      setsToWin: selectedTournament.settings.defaultSetsToWin,
      startingPlayerId: 'p1',
      players: [
        { playerId: home?.id ?? `guest-${fixture.homePlayerId}`, displayName: fixture.homePlayerId, checkoutMode: home?.preferredCheckoutMode ?? 'DOUBLE_OUT' },
        { playerId: away?.id ?? `guest-${fixture.awayPlayerId}`, displayName: fixture.awayPlayerId, checkoutMode: away?.preferredCheckoutMode ?? 'DOUBLE_OUT' },
      ],
    });

    await tournamentApiClient.linkFixtureMatch(selectedTournament.tournamentId, roundNumber, fixtureIndex, created.matchId);
    navigate(`/match/${created.matchId}?tournamentId=${selectedTournament.tournamentId}&round=${roundNumber}&fixture=${fixtureIndex}`);
  };

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="rounded-2xl hero-gradient border soft-border p-4">
        <h2 className="text-xl uppercase">Turniere</h2>
        <p className="text-xs muted-text">Adaptive Brackets, Match-Start aus Turnierkarte, Ergebnisrückfluss.</p>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Neues Turnier</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="Turniername" />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setFormat('SINGLE_ELIMINATION')} className={`rounded-lg p-2 text-xs ${format === 'SINGLE_ELIMINATION' ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>K.O.</button>
          <button onClick={() => setFormat('ROUND_ROBIN')} className={`rounded-lg p-2 text-xs ${format === 'ROUND_ROBIN' ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>Round Robin</button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <select value={byePlacement} onChange={(e) => setByePlacement(e.target.value as ByePlacement)} className="rounded bg-slate-800 p-2">
            <option value="ROUND_1">Freilos Runde 1</option>
            <option value="DISTRIBUTED">Freilos verteilt</option>
            <option value="PLAY_IN">Play-In Quali</option>
          </select>
          <select value={seedingMode} onChange={(e) => setSeedingMode(e.target.value as SeedingMode)} className="rounded bg-slate-800 p-2">
            <option value="RANDOM">Seed random</option>
            <option value="MANUAL">Seed manuell</option>
            <option value="RANKING">Seed Ranking</option>
          </select>
          <input type="number" min={1} max={15} value={defaultLegsPerSet} onChange={(e) => setDefaultLegsPerSet(Number(e.target.value || 1))} className="rounded bg-slate-800 p-2" placeholder="Legs/Set" />
          <input type="number" min={1} max={9} value={defaultSetsToWin} onChange={(e) => setDefaultSetsToWin(Number(e.target.value || 1))} className="rounded bg-slate-800 p-2" placeholder="Sets to Win" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg border soft-border bg-slate-900/60 p-3 text-[11px] space-y-1">
            <p className="uppercase muted-text">Legende Freilos-Optionen</p>
            <p><span className="primary-text font-semibold">Freilos Runde 1:</span> Alle Freilose liegen in Runde 1. Manche Spieler steigen direkt in Runde 2 ein.</p>
            <p><span className="primary-text font-semibold">Freilos verteilt:</span> Freilose werden über den Baum verteilt, damit nicht alles auf einer Bracket-Seite hängt.</p>
            <p><span className="primary-text font-semibold">Play-In Quali:</span> Es gibt Vorquali-Duelle für letzte Hauptfeldplätze, statt nur automatische Freilose.</p>
          </div>

          <div className="rounded-lg border soft-border bg-slate-900/60 p-3 text-[11px] space-y-1">
            <p className="uppercase muted-text">Legende Seed-Optionen</p>
            <p><span className="primary-text font-semibold">Seed random:</span> Teilnehmer werden zufällig im Bracket verteilt (Losverfahren).</p>
            <p><span className="primary-text font-semibold">Seed Ranking:</span> Setzung nach Rangliste/ELO, damit Top-Spieler später aufeinandertreffen.</p>
            <p><span className="primary-text font-semibold">Seed manuell:</span> Startpositionen/Paarungen werden manuell durch euch festgelegt.</p>
          </div>
        </div>

        <button onClick={() => setAllowRoundModeSwitch((v) => !v)} className="rounded bg-slate-800 p-2 text-xs text-left">
          Rundenmodus veränderbar: <span className="primary-text">{allowRoundModeSwitch ? 'Ja' : 'Nein'}</span>
        </button>

        <p className="text-xs muted-text">Vereinsmitglieder einladen</p>
        <div className="flex flex-wrap gap-2">
          {clubPlayers.map((player) => (
            <button key={player.id} onClick={() => toggleMember(player.displayName)} className={`rounded-full px-3 py-1 text-xs ${selectedMembers.includes(player.displayName) ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
              {player.displayName}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="rounded-lg bg-slate-800 p-2 text-xs" placeholder="Gastname" />
          <button onClick={addGuest} className="rounded-lg bg-slate-700 px-3 text-xs">Gast +</button>
        </div>
        <div className="flex flex-wrap gap-2">{guestPlayers.map((g) => <span key={g} className="rounded-full bg-amber-900/40 px-3 py-1 text-xs text-amber-200">{g}</span>)}</div>

        <div className="rounded-xl border soft-border bg-slate-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase muted-text">Turnier-Vorschau vor Erstellung</p>
            <p className="text-[11px] muted-text">Teilnehmer: {participantsDraft.length}</p>
          </div>
          {byePlacement === 'PLAY_IN' && format === 'SINGLE_ELIMINATION' && (
            <p className="text-[11px] text-amber-200">Play-In aktiv: direkte Qualifikanten spielen gegen BYE, übrige Teilnehmer in Quali-Duellen.</p>
          )}
          {tournamentPreview.length === 0 ? (
            <p className="text-xs muted-text">Mindestens 2 Teilnehmer für die Vorschau wählen.</p>
          ) : (
            <div className="space-y-2">
              {tournamentPreview.map((round) => (
                <div key={`preview-${round.roundNumber}`} className="rounded bg-slate-800/70 p-2">
                  <p className="text-[11px] uppercase mb-1">Round {round.roundNumber} · {round.mode.replace('_', ' ')}</p>
                  <div className="space-y-1">
                    {round.matches.map((match, idx) => {
                      const isBye = match.homePlayerId === 'BYE' || match.awayPlayerId === 'BYE';
                      const isTbd = match.homePlayerId === 'TBD' || match.awayPlayerId === 'TBD';
                      const tag = isBye ? 'Direktquali/Freilos' : isTbd ? 'Folgerunde' : round.roundNumber === 1 && byePlacement === 'PLAY_IN' ? 'Play-In-Duell' : 'Duell';
                      return <p key={`p-${round.roundNumber}-${idx}`} className="text-[11px] muted-text">[{tag}] {match.homePlayerId} vs {match.awayPlayerId}</p>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={createTournament} className="w-full rounded-xl bg-sky-400 p-2 text-sm font-semibold text-slate-900">Turnier erstellen</button>
      </div>

      {selectedTournament && (
        <div className="rounded-2xl card-bg border soft-border p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{selectedTournament.name}</p>
              <p className="text-xs muted-text">{selectedTournament.format.replace('_', ' ')} · {new Date(selectedTournament.updatedAt).toLocaleString('de-DE')}</p>
            </div>
            {selectedTournament.championPlayerId && <span className="rounded bg-emerald-900/40 px-2 py-1 text-xs text-emerald-200">Sieger: {selectedTournament.championPlayerId}</span>}
          </div>

          {rounds.map((round) => (
            <div key={round.roundNumber} className="grid grid-cols-2 gap-2 items-center text-xs">
              <span>Round {round.roundNumber}</span>
              <select value={round.mode} onChange={(e) => setRoundMode(round.roundNumber, e.target.value as RoundMode)} className="rounded bg-slate-800 p-1" disabled={!selectedTournament.settings.allowRoundModeSwitch}>
                <option value="X01_301">301</option>
                <option value="X01_501">501</option>
                <option value="CRICKET">Cricket</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <TournamentBracket rounds={rounds} onSelectWinner={onSelectWinner} onStartMatch={onStartMatch} />

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-2">
        <h3 className="text-sm uppercase">Vereinshistorie</h3>
        <div className="space-y-2 max-h-56 overflow-auto">
          {tournaments.map((entry) => (
            <button key={entry.tournamentId} onClick={() => setSelectedTournamentId(entry.tournamentId)} className={`w-full text-left rounded-lg p-2 border ${selectedTournament?.tournamentId === entry.tournamentId ? 'border-sky-400 bg-sky-900/20' : 'soft-border bg-slate-900/40'}`}>
              <p className="text-sm font-semibold">{entry.name}</p>
              <p className="text-xs muted-text">{entry.format.replace('_', ' ')} · {entry.championPlayerId ? `Sieger ${entry.championPlayerId}` : 'Laufend'}</p>
            </button>
          ))}
        </div>
      </div>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}
    </section>
  );
}


function buildTournamentPreview(
  participants: string[],
  format: TournamentFormat,
  roundModes: RoundMode[],
  byePlacement: ByePlacement,
): TournamentRound[] {
  if (participants.length < 2) return [];

  if (format === 'ROUND_ROBIN') {
    const fixtures: Array<{ homePlayerId: string; awayPlayerId: string }> = [];
    for (let i = 0; i < participants.length; i += 1) {
      for (let j = i + 1; j < participants.length; j += 1) {
        fixtures.push({ homePlayerId: participants[i], awayPlayerId: participants[j] });
      }
    }
    return [{ roundNumber: 1, mode: roundModes[0] ?? 'X01_501', matches: fixtures }];
  }

  const seeded = byePlacement === 'PLAY_IN'
    ? buildPlayInSeed(participants)
    : buildClassicSeed(participants, byePlacement);

  const rounds: TournamentRound[] = [];
  let currentSize = seeded.length;
  let roundNumber = 1;
  while (currentSize >= 2) {
    const fixtureCount = currentSize / 2;
    rounds.push({
      roundNumber,
      mode: roundModes[roundNumber - 1] ?? 'X01_501',
      matches: Array.from({ length: fixtureCount }, (_, index) => ({
        homePlayerId: roundNumber === 1 ? seeded[index * 2] ?? 'TBD' : 'TBD',
        awayPlayerId: roundNumber === 1 ? seeded[index * 2 + 1] ?? 'TBD' : 'TBD',
      })),
    });
    currentSize = fixtureCount;
    roundNumber += 1;
  }

  return rounds;
}

function buildPlayInSeed(participants: string[]): string[] {
  const n = participants.length;
  const lowerPower = 2 ** Math.floor(Math.log2(Math.max(2, n)));
  if (n <= lowerPower) return buildClassicSeed(participants, 'ROUND_1');

  const playInMatchCount = n - lowerPower;
  const directCount = n - playInMatchCount * 2;
  const directPlayers = participants.slice(0, directCount);
  const playInPlayers = participants.slice(directCount);

  const seeded: string[] = [];
  for (const player of directPlayers) seeded.push(player, 'BYE');
  for (let i = 0; i < playInMatchCount; i += 1) seeded.push(playInPlayers[i * 2] ?? 'BYE', playInPlayers[i * 2 + 1] ?? 'BYE');
  return seeded;
}

function buildClassicSeed(participants: string[], byePlacement: ByePlacement): string[] {
  const targetSize = Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, participants.length))));
  const byeCount = targetSize - participants.length;
  if (byeCount <= 0) return participants;

  if (byePlacement === 'DISTRIBUTED') {
    const result: string[] = [];
    const slots = participants.length + byeCount;
    const byeEvery = Math.max(2, Math.floor(slots / byeCount));
    let p = 0;
    let b = 0;
    for (let i = 0; i < slots; i += 1) {
      const shouldBye = b < byeCount && (i % byeEvery === 1 || p >= participants.length);
      if (shouldBye) {
        result.push('BYE');
        b += 1;
      } else {
        result.push(participants[p] ?? 'BYE');
        p += 1;
      }
    }
    return result;
  }

  return [...participants, ...Array.from({ length: byeCount }, () => 'BYE')];
}
