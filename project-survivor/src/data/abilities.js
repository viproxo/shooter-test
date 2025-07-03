// --- WEAPONS ---
export const PISTOL = {
  id: 'pistol',
  name: 'Pistol',
  type: 'weapon',
  description: 'Fires bullets at the nearest enemy.',
  fireRate: 1000, // ms per shot
  projectileSize: 10,
  projectileSpeed: 10,
  projectileColor: 'yellow',
  damage: 25,
  label: 'projectile', // For Matter.js body
};

export const GUARDIAN_ORBITER = {
  id: 'guardian',
  name: 'Guardian Orbiter',
  type: 'weapon',
  description: 'Orbits the player, damaging enemies on contact.',
  damage: 15, // Per contact, per orb
  orbitRadius: 75,
  rotationSpeed: 0.05, // radians per tick (approx 3 rad/sec at 60fps)
  size: 20, // Orb size
  color: 'lightblue',
  maxOrbs: 3, // Example: player can gain more orbs of this type
  label: 'guardian_orb', // For Matter.js body
};

export const LIGHTNING_EMITTER = {
  id: 'lightning',
  name: 'Lightning Emitter',
  type: 'weapon',
  description: 'Periodically zaps a random nearby area.',
  damage: 50,
  interval: 3000, // ms
  areaSize: 80, // Diameter of damage circle
  color: 'yellow', // For visual effect
  label: 'lightning_strike', // For potential temporary sensor body or visual
};

// --- PASSIVE SKILLS ---
export const POWER_BOOST = {
  id: 'powerBoost',
  name: 'Power Boost',
  type: 'passive',
  description: '+10% damage to all weapons.',
  effect: { target: 'damageModifier', value: 0.10, operation: 'multiply_add' },
  maxStacks: 5, // Example: can be selected multiple times
};

export const SPEED_BOOST = {
  id: 'speedBoost',
  name: 'Speed Boost',
  type: 'passive',
  description: '+10% player movement speed.',
  effect: { target: 'playerSpeed', value: 0.10, operation: 'multiply_add' },
  maxStacks: 5,
};

export const MAX_HEALTH_UP = {
  id: 'maxHealthUp',
  name: 'Max Health Up',
  type: 'passive',
  description: '+20% max HP and heals the same amount.',
  effect: { target: 'playerMaxHP', value: 0.20, operation: 'multiply_add', alsoHeal: true },
  maxStacks: 5,
};

export const ALL_ABILITIES_ARRAY = [
  PISTOL, // Should pistol be an option to re-select for upgrades? For now, yes.
  GUARDIAN_ORBITER,
  LIGHTNING_EMITTER,
  POWER_BOOST,
  SPEED_BOOST,
  MAX_HEALTH_UP,
];

// For easy lookup by ID
export const ALL_ABILITIES_MAP = ALL_ABILITIES_ARRAY.reduce((map, ability) => {
  map[ability.id] = ability;
  return map;
}, {});
