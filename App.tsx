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
};

const START_SCORES = [301, 501] as const;

export default function App() {
  const [startScore, setStartScore] = useState<number>(501);
  const [playerA, setPlayerA] = useState('Spieler 1');
  const [playerB, setPlayerB] = useState('Spieler 2');

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [throwInput, setThrowInput] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const gameStarted = players.length > 0;

  const activePlayer = useMemo(() => players[activeIndex], [players, activeIndex]);

  const setupGame = () => {
    const names = [playerA.trim() || 'Spieler 1', playerB.trim() || 'Spieler 2'];

    setPlayers(
      names.map((name, index) => ({
        id: String(index),
        name,
        score: startScore,
      }))
    );
    setActiveIndex(0);
    setThrowInput('');
    setWinner(null);
    setHistory([`Spiel gestartet (${startScore})`]);
  };

  const restartLeg = () => {
    if (!gameStarted) return;
    setPlayers((prev) => prev.map((p) => ({ ...p, score: startScore })));
    setActiveIndex(0);
    setThrowInput('');
    setWinner(null);
    setHistory([`Neues Leg gestartet (${startScore})`]);
  };

  const nextPlayer = () => {
    setActiveIndex((prev) => (players.length === 0 ? 0 : (prev + 1) % players.length));
  };

  const submitThrow = () => {
    if (!activePlayer || winner) return;

    const points = Number(throwInput.replace(',', '.'));
    if (!Number.isInteger(points) || points < 0 || points > 180) {
      Alert.alert('Ungültige Eingabe', 'Bitte eine ganze Zahl zwischen 0 und 180 eingeben.');
      return;
    }

    setPlayers((prev) => {
      const updated = [...prev];
      const current = updated[activeIndex];
      const remaining = current.score - points;

      if (remaining < 0) {
        setHistory((h) => [
          `${current.name}: Bust (${points}) → bleibt bei ${current.score}`,
          ...h,
        ]);
        setThrowInput('');
        setTimeout(nextPlayer, 0);
        return updated;
      }

      current.score = remaining;
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
          <TextInput style={styles.input} value={playerA} onChangeText={setPlayerA} />

          <Text style={styles.label}>Spieler 2</Text>
          <TextInput style={styles.input} value={playerB} onChangeText={setPlayerB} />

          <Pressable style={styles.primaryBtn} onPress={setupGame}>
            <Text style={styles.primaryBtnText}>{gameStarted ? 'Neu starten' : 'Spiel starten'}</Text>
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
            {players.map((p, idx) => (
              <View key={p.id} style={[styles.playerRow, idx === activeIndex && styles.playerRowActive]}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerScore}>{p.score}</Text>
              </View>
            ))}

            {winner ? (
              <Text style={styles.winner}>🏆 {winner} gewinnt das Leg!</Text>
            ) : (
              <>
                <Text style={styles.turnLabel}>Am Zug: {activePlayer?.name}</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.throwInput]}
                    value={throwInput}
                    onChangeText={setThrowInput}
                    keyboardType="number-pad"
                    placeholder="Punkte (0-180)"
                    placeholderTextColor="#8a8a8a"
                  />
                  <Pressable style={styles.primaryBtnSmall} onPress={submitThrow}>
                    <Text style={styles.primaryBtnText}>Eintragen</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verlauf</Text>
            {history.slice(0, 8).map((line, i) => (
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
  playerScore: {
    color: '#fff',
    fontSize: 18,
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
  historyText: {
    color: '#ddd',
  },
});
