import React from 'react';
import { View } from 'react-native';

const Enemy = ({ size, position, color = 'red' }) => { // Default color red
  const style = {
    position: 'absolute', // Necessary for GameEngine
    width: size,
    height: size,
    backgroundColor: color,
    // borderRadius: size / 2, // Uncomment for circular enemies
    left: position.x - size / 2, // Adjust for center origin
    top: position.y - size / 2,  // Adjust for center origin
  };

  return <View style={style} />;
};

export default Enemy;
