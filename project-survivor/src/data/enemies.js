import Enemy from '../components/game/Enemy'; // Import the component

export const STANDARD_ZOMBIE = {
  id_prefix: 'zombie_', // Added underscore for clarity
  renderer: Enemy, // Direct reference to the Enemy component
  size: 30,
  color: 'green',
  hp: 50,
  speed: 1.5, // Slightly faster than 1 for a bit more challenge
  damage: 10, // Damage dealt on collision
  type: 'enemy', // For identifying the entity type
  xpValue: 10, // XP awarded for defeating this enemy
};

// Future enemy types can be added here:
// export const FAST_ZOMBIE = { ... };
// export const TANK_ZOMBIE = { ... };
