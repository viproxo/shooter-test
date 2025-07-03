import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useGameStore from '../../state/gameStore';

const GameHUD = () => {
  const { playerHP, playerMaxHP, playerLevel, playerXP, playerMaxXP, gameTime } = useGameStore();

  // Format gameTime (seconds) into MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.hudContainer}>
      <View style={styles.statRow}>
        <Text style={styles.hudText}>HP: {playerHP} / {playerMaxHP}</Text>
        <Text style={styles.hudText}>Level: {playerLevel}</Text>
      </View>
      <View style={styles.xpBarContainer}>
        <View style={[styles.xpBar, { width: `${(playerXP / playerMaxXP) * 100}%` }]} />
        <Text style={styles.xpText}>XP: {playerXP} / {playerMaxXP}</Text>
      </View>
      <Text style={styles.hudText}>Time: {formatTime(gameTime)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  hudText: {
    color: 'white',
    fontSize: 16,
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: '#555',
    borderRadius: 5,
    justifyContent: 'center',
    overflow: 'hidden', // Ensures the xpBar stays within rounded corners
    marginBottom: 5,
  },
  xpBar: {
    height: '100%',
    backgroundColor: 'lightblue', // Or any color you prefer for XP
  },
  xpText: {
    position: 'absolute', // Position text over the bar
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default GameHUD;
