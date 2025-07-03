import React from 'react';
import GameScreen from './src/screens/GameScreen'; // Adjusted path
// import MainMenuScreen from './src/screens/MainMenuScreen'; // Will use this later with navigation

export default function App() {
  // For now, rendering GameScreen directly to test game components
  // Later, this will be replaced by a navigation container
  // that initially shows MainMenuScreen.
  return <GameScreen />;
  // return <MainMenuScreen />;
}
