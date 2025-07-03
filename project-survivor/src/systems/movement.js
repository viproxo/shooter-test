import Matter from 'matter-js';
import useGameStore from '../state/gameStore';

const movementSystem = (entities, { time, screen }) => {
  const { joystickVector, playerSpeed } = useGameStore.getState();
  const playerEntity = entities.player; // Renamed for clarity

  // Player Movement
  if (playerEntity && playerEntity.body && joystickVector) {
    const { x: moveX, y: moveY } = joystickVector;
    // const { width: screenWidth, height: screenHeight } = screen; // Screen dimensions for boundary
    // const playerSize = playerEntity.size || 50;
    // const halfPlayerSize = playerSize / 2;

    // Apply velocity to player body
    const newVelocity = { x: moveX * playerSpeed, y: moveY * playerSpeed };
    Matter.Body.setVelocity(playerEntity.body, newVelocity);

    // Boundary checks for player are implicitly handled by Matter.js if walls are added.
    // For now, player can go off-screen if no walls.
    // If explicit boundary is still needed without walls:
    // const { x: playerX, y: playerY } = playerEntity.body.position;
    // if (playerX - halfPlayerSize < 0) Matter.Body.setPosition(playerEntity.body, { x: halfPlayerSize, y: playerY });
    // etc. - This is complex with physics, usually prefer static boundary bodies.
  }

  // Enemy Movement
  const playerBody = playerEntity ? playerEntity.body : null;
  if (!playerBody) return entities; // No player, no chase

  for (const id in entities) {
    if (entities[id].type === 'enemy' && entities[id].body) {
      const enemy = entities[id];
      const enemyBody = enemy.body;
      const enemySpeed = enemy.details.speed || 1;

      const dx = playerBody.position.x - enemyBody.position.x;
      const dy = playerBody.position.y - enemyBody.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const dirX = dx / distance;
        const dirY = dy / distance;

        Matter.Body.setVelocity(enemyBody, {
          x: dirX * enemySpeed,
          y: dirY * enemySpeed
        });
      } else {
        Matter.Body.setVelocity(enemyBody, { x: 0, y: 0 }); // Stop if on player
      }
    }
  }

  return entities;
};

export default movementSystem;
