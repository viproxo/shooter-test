import React from 'react';
import { View } from 'react-native';

const Projectile = ({ size, position, color = 'yellow' }) => {
  // Position is the center of the projectile, same as Player/Enemy
  const style = {
    position: 'absolute',
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: size / 2, // Make it a circle
    left: position.x - size / 2,
    top: position.y - size / 2,
  };

  return <View style={style} />;
};

export default Projectile;
