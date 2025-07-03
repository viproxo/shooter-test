import { Dimensions } from 'react-native';
import Matter from 'matter-js'; // Import Matter
import useGameStore from '../state/gameStore';
import { STANDARD_ZOMBIE } from '../data/enemies';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

let nextEnemyId = 0; // Simple counter for unique IDs

const SPAWN_INTERVAL_INITIAL = 5000; // milliseconds (5 seconds)
const SPAWN_INTERVAL_MIN = 1000; // Minimum interval (1 second)
const SPAWN_INTERVAL_DECREMENT = 200; // How much to decrease interval by
const ENEMIES_PER_WAVE_INITIAL = 3;
const ENEMIES_PER_WAVE_INCREMENT = 1; // Increase enemies per wave over time
const MAX_ENEMIES_PER_WAVE = 15;

const spawnerSystem = (entities, { time }) => {
  const { gameTime } = useGameStore.getState();

  // Initialize spawner state if not present
  if (!entities.spawner) {
    entities.spawner = {
      spawnTimer: 0,
      currentSpawnInterval: SPAWN_INTERVAL_INITIAL,
      enemiesThisWave: ENEMIES_PER_WAVE_INITIAL,
      lastSpawnTimeMark: 0, // To track when to increase difficulty
    };
  }

  const spawner = entities.spawner;
  spawner.spawnTimer += time.delta;

  // Difficulty scaling over gameTime (e.g., every 30 seconds)
  if (gameTime > 0 && gameTime % 30 === 0 && gameTime !== spawner.lastSpawnTimeMark) {
    spawner.lastSpawnTimeMark = gameTime;

    // Decrease spawn interval
    if (spawner.currentSpawnInterval > SPAWN_INTERVAL_MIN) {
      spawner.currentSpawnInterval = Math.max(
        SPAWN_INTERVAL_MIN,
        spawner.currentSpawnInterval - SPAWN_INTERVAL_DECREMENT
      );
    }

    // Increase enemies per wave
    if (spawner.enemiesThisWave < MAX_ENEMIES_PER_WAVE) {
      spawner.enemiesThisWave += ENEMIES_PER_WAVE_INCREMENT;
    }
  }


  if (spawner.spawnTimer >= spawner.currentSpawnInterval) {
    for (let i = 0; i < spawner.enemiesThisWave; i++) {
      const enemyId = `${STANDARD_ZOMBIE.id_prefix}${nextEnemyId++}`;

      let spawnPosition;
      const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      const spawnMargin = STANDARD_ZOMBIE.size; // Spawn just off screen

      switch (edge) {
        case 0: // Top edge
          spawnPosition = { x: Math.random() * screenWidth, y: -spawnMargin };
          break;
        case 1: // Right edge
          spawnPosition = { x: screenWidth + spawnMargin, y: Math.random() * screenHeight };
          break;
        case 2: // Bottom edge
          spawnPosition = { x: Math.random() * screenWidth, y: screenHeight + spawnMargin };
          break;
        case 3: // Left edge
        default:
          spawnPosition = { x: -spawnMargin, y: Math.random() * screenHeight };
          break;
      }

      const enemyBody = Matter.Bodies.rectangle(
        spawnPosition.x,
        spawnPosition.y,
        STANDARD_ZOMBIE.size,
        STANDARD_ZOMBIE.size,
        {
          label: 'enemy',
          id: Matter.Common.nextId(), // Matter's own body ID
          entityId: enemyId, // Store our entity ID on the body for lookup
          frictionAir: 0.02, // Some air friction
          // restitution: 0.5, // Make them a bit bouncy if desired
        }
      );

      // Add to physics world - this needs access to the world
      // This system needs entities.physics.world
      const world = entities.physics.world;
      Matter.World.add(world, [enemyBody]);

      entities[enemyId] = {
        id: enemyId, // Our internal entity ID
        body: enemyBody, // The Matter.js body
        renderer: STANDARD_ZOMBIE.renderer,
        type: STANDARD_ZOMBIE.type,
        details: { ...STANDARD_ZOMBIE, hp: STANDARD_ZOMBIE.hp }, // Ensure HP is fresh copy
        // position: spawnPosition, // Now derived from body
        size: STANDARD_ZOMBIE.size,
      };
    }
    spawner.spawnTimer = 0; // Reset timer
  }

  return entities;
};

export default spawnerSystem;
