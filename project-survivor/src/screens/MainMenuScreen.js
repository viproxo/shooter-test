import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const MainMenuScreen = () => {
  const handleStartGame = () => {
    console.log('Start Game button pressed');
    // Navigation logic will be added later
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Survivor</Text>
      <Button title="Start Game" onPress={handleStartGame} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
  },
});

export default MainMenuScreen;
