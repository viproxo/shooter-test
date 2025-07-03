import React from 'react';
import { View, StyleSheet } from 'react-native';

const Player = ({ size, position }) => {
  const style = {
    position: 'absolute', // Necessary for GameEngine to position it
    width: size,
    height: size,
    backgroundColor: 'blue', // Player color
    borderRadius: size / 2, // Make it a circle
    left: (position ? position.x : 0) - size / 2, // Adjust for center origin
    top: (position ? position.y : 0) - size / 2,  // Adjust for center origin
  };

  return <View style={style} />;
};

export default Player;
