import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Player = {
  id: string;
  name: string;
  score: number;
  dartsThrown: number;
  totalScored: number;
};

type ThrowRecord = {
  playerIndex: number;
  points: number;
  prevScore: number;
};

const START_SCORES = [301, 501] as const;
const QUICK_POINTS = [26, 45, 60, 81, 100, 140, 180] as const;

export default function App() {
  const [startScore, setStartScore] = useState<number>(501);
  const [playerA, setPlayerA] = useState('Spieler 1');
  const [playerB, setPlayerB] = useState('Spieler 2');

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [throwInput, setThrowInput] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [throwStack, setThrowStack] = useState<ThrowRecord[]>([]);

  const gameStarted = players.length > 0;
  const activePlayer = useMemo(() => players[activeIndex], [players, activeIndex]);

  const setupGame = () => {
    const names = [playerA.trim() || 'Spieler 1', playerB.trim() || 'Spieler 2'];

    setPlayers(
      names.map((name, index) => ({
        id: String(index),
        name,
        score: startScore,
        dartsThrown: 0,
        totalScored: 0,
      }))
    );
    setActiveIndex(0);
    setThrowInput('');
    setWinner(null);
    setThrowStack([]);
    setHistory([`Spiel gestartet (${startScore})`]);
  };

  const nextPlayer = () => {
    setActiveIndex((prev) => (players.length === 0 ? 0 : (prev + 1) % players.length));
  };

  const parsePoints = (value: string | number) => {
    const raw = String(value).trim().replace(',', '.');
    const points = Number(raw);

    if (!Number.isInteger(points) || points < 0 || points > 180) return null;
    return points;
  };

  const addThrow = (rawPoints?: number) => {
    if (!activePlayer || winner) return;

    const points = parsePoints(rawPoints ?? throwInput);
    if (points === null) {
      Alert.alert('Ungültige Eingabe', 'Bitte eine ganze Zahl zwischen 0 und 180 eingeben.');
      return;
    }

    setPlayers((prev) => {
      const updated = [...prev];
      const current = { ...updated[activeIndex] };
      const remaining = current.score - points;

      // Bust: zu viel geworfen
      if (remaining < 0) {
        setHistory((h) => [
          `${current.name}: Bust (${points}) → bleibt bei ${current.score}`,
          ...h,
        ]);
        setThrowInput('');
        setTimeout(nextPlayer, 0);
        return prev;
      }

      setThrowStack((stack) => [
        ...stack,
        {
          playerIndex: activeIndex,
          points,
          prevScore: current.score,
        },
      ]);

      current.score = remaining;
      current.dartsThrown += 3;
      current.totalScored += points;
      updated[activeIndex] = current;

      setHistory((h) => [`${current.name}: -${points} → ${remaining}`, ...h]);

      if (remaining === 0) {
        setWinner(current.name);
      } else {
        setTimeout(nextPlayer, 0);
      }

      setThrowInput('');
      return updated;
    });
  };

  const undoLastThrow = () => {
    if (throwStack.length === 0 || players.length === 0) {
      Alert.alert('Nichts zum Rückgängig machen', 'Es wurde noch kein gültiger Wurf eingetragen.');
      return;
    }

    const last = throwStack[throwStack.length - 1];

    setPlayers((prev) => {
      const updated = [...prev];
      const player = { ...updated[last.playerIndex] };

      player.score = last.prevScore;
      player.dartsThrown = Math.max(0, player.dartsThrown - 3);
      player.totalScored = Math.max(0, player.totalScored - last.points);
      updated[last.playerIndex] = player;

      return updated;
    });

    setThrowStack((stack) => stack.slice(0, -1));
    setWinner(null);
    setActiveIndex(last.playerIndex);
    setHistory((h) => [`↩️ Undo: letzter Wurf von ${players[last.playerIndex]?.name ?? 'Spieler'}`, ...h]);
  };

  const restartLeg = () => {
    if (!gameStarted) return;

    Alert.alert('Leg zurücksetzen', 'Soll das aktuelle Leg wirklich zurückgesetzt werden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Zurücksetzen',
        style: 'destructive',
        onPress: () => {
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              score: startScore,
              dartsThrown: 0,
              totalScored: 0,
            }))
          );
          setActiveIndex(0);
          setThrowInput('');
          setWinner(null);
          setThrowStack([]);
          setHistory([`Neues Leg gestartet (${startScore})`]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎯 Darts Scoreboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Setup</Text>
          <Text style={styles.label}>Startscore</Text>
          <View style={styles.row}>
            {START_SCORES.map((score) => (
              <Pressable
                key={score}
                style={[styles.scoreButton, startScore === score && styles.scoreButtonActive]}
                onPress={() => setStartScore(score)}
              >
                <Text style={styles.scoreButtonText}>{score}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Spieler 1</Text>
          <TextInput style={styles.input} value={playerA} onChangeText={setPlayerA} maxLength={20} />

          <Text style={styles.label}>Spieler 2</Text>
          <TextInput style={styles.input} value={playerB} onChangeText={setPlayerB} maxLength={20} />

          <Pressable style={styles.primaryBtn} onPress={setupGame}>
            <Text style={styles.primaryBtnText}>{gameStarted ? 'Neues Spiel starten' : 'Spiel starten'}</Text>
          </Pressable>

          {gameStarted && (
            <Pressable style={styles.secondaryBtn} onPress={restartLeg}>
              <Text style={styles.secondaryBtnText}>Leg zurücksetzen</Text>
            </Pressable>
          )}
        </View>

        {gameStarted && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spielstand</Text>
            {players.map((p, idx) => {
              const avg = p.dartsThrown > 0 ? (p.totalScored / p.dartsThrown) * 3 : 0;

              return (
                <View key={p.id} style={[styles.playerRow, idx === activeIndex && styles.playerRowActive]}>
                  <View>
                    <Text style={styles.playerName}>{p.name}</Text>
                    <Text style={styles.playerStats}>Avg: {avg.toFixed(2)} · Punkte: {p.totalScored}</Text>
                  </View>
                  <Text style={styles.playerScore}>{p.score}</Text>
                </View>
              );
            })}

            {winner ? (
              <Text style={styles.winner}>🏆 {winner} gewinnt das Leg!</Text>
            ) : (
              <>
                <Text style={styles.turnLabel}>Am Zug: {activePlayer?.name}</Text>

                <View style={styles.quickWrap}>
                  {QUICK_POINTS.map((p) => (
                    <Pressable key={p} style={styles.quickBtn} onPress={() => addThrow(p)}>
                      <Text style={styles.quickBtnText}>{p}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.throwInput]}
                    value={throwInput}
                    onChangeText={setThrowInput}
                    keyboardType="number-pad"
                    placeholder="Punkte (0-180)"
                    placeholderTextColor="#8a8a8a"
                    returnKeyType="done"
                    onSubmitEditing={() => addThrow()}
                  />
                  <Pressable style={styles.primaryBtnSmall} onPress={() => addThrow()}>
                    <Text style={styles.primaryBtnText}>Eintragen</Text>
                  </Pressable>
                </View>

                <Pressable style={styles.undoBtn} onPress={undoLastThrow}>
                  <Text style={styles.undoBtnText}>↩️ Letzten Wurf rückgängig</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verlauf</Text>
            {history.slice(0, 10).map((line, i) => (
              <Text key={`${line}-${i}`} style={styles.historyText}>
                • {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#d7d7d7',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  scoreButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  scoreButtonActive: {
    backgroundColor: '#2f7cff',
  },
  scoreButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#2b2b2b',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  throwInput: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#2f7cff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnSmall: {
    backgroundColor: '#2f7cff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  playerRowActive: {
    borderWidth: 1,
    borderColor: '#2f7cff',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerStats: {
    color: '#b8b8b8',
    fontSize: 12,
    marginTop: 2,
  },
  playerScore: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  turnLabel: {
    color: '#c2ddff',
    fontWeight: '600',
  },
  winner: {
    color: '#7ff6b2',
    fontWeight: '700',
    fontSize: 16,
  },
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  undoBtn: {
    backgroundColor: '#4f3f1f',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  undoBtnText: {
    color: '#ffd999',
    fontWeight: '700',
  },
  historyText: {
    color: '#ddd',
  },
});
