import Matter from 'matter-js';

const physicsSystem = (entities, { time, dispatch }) => {
  const engine = entities.physics.engine;
  const world = entities.physics.world;

  // Update the Matter engine
  Matter.Engine.update(engine, time.delta);

  // Collision Detection
  const collisions = Matter.Collision.collides(engine.detector.pairs.list, engine);

  if (collisions.length > 0) {
    collisions.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Example: Player vs Enemy
      if ((bodyA.label === 'player' && bodyB.label === 'enemy') || (bodyA.label === 'enemy' && bodyB.label === 'player')) {
        const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
        const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;

        // Find the enemy entity details. This assumes enemy entity ID is stored on body, or we find it.
        // For now, we need a way to get damage from the enemy body.
        // Let's assume enemy body has `enemyEntityId` and we can access `entities[enemyEntityId].details.damage`
        // This part needs careful wiring with how spawner creates enemy bodies.
        // For the event, we'll pass the enemy body's associated entity ID if possible.
        // A simpler approach for now: dispatch with body IDs and let GameScreen resolve entities.

        // To get the actual enemy entity details (like damage), we need a mapping from body.id to entity.id
        // Let's assume the enemy's main entity ID is stored on its body as `entityId`
        const enemyEntityId = enemyBody.entityId;
        const enemyEntity = entities[enemyEntityId];

        if (enemyEntity && enemyEntity.details) {
          dispatch({
            type: 'player-hit-enemy',
            // playerId: playerBody.id, // Matter body ID - not strictly needed by handler
            // enemyId: enemyBody.id,   // Matter body ID - not strictly needed by handler
            enemyEntityId: enemyEntityId, // Actual entity ID for data lookup
            enemyDetails: enemyEntity.details // Pass enemy details for damage calculation
          });
        }
      } else if ((bodyA.label === 'projectile' && bodyB.label === 'enemy') || (bodyA.label === 'enemy' && bodyB.label === 'projectile')) {
        // Projectile vs Enemy
        const projectileBody = bodyA.label === 'projectile' ? bodyA : bodyB;
        const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
        const projectileEntityId = projectileBody.entityId; // Our entity ID
        const enemyEntityId = enemyBody.entityId;           // Our entity ID

        if (entities[projectileEntityId] && entities[enemyEntityId]) { // Ensure entities still exist
            dispatch({
                type: 'projectile-hit-enemy',
                projectileEntityId: projectileEntityId,
                enemyEntityId: enemyEntityId,
            });
        }
      } else if ((bodyA.label === 'guardian_orb' && bodyB.label === 'enemy') || (bodyA.label === 'enemy' && bodyB.label === 'guardian_orb')) {
        // Guardian Orb vs Enemy
        const orbBody = bodyA.label === 'guardian_orb' ? bodyA : bodyB;
        const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
        const orbEntityId = orbBody.entityId;
        const enemyEntityId = enemyBody.entityId;

        if (entities[orbEntityId] && entities[enemyEntityId]) { // Ensure entities still exist
            // Guardian orbs might hit frequently, so apply damage with a cooldown per enemy
            const enemyEntity = entities[enemyEntityId];
            if (!enemyEntity.guardianHitCooldowns) enemyEntity.guardianHitCooldowns = {};

            if (!enemyEntity.guardianHitCooldowns[orbEntityId] || Date.now() - enemyEntity.guardianHitCooldowns[orbEntityId] > 500) { // 500ms cooldown
                enemyEntity.guardianHitCooldowns[orbEntityId] = Date.now();
                dispatch({
                    type: 'guardian-hit-enemy', // New event type
                    orbEntityId: orbEntityId,
                    enemyEntityId: enemyEntityId,
                    // Orb damage is on the orb entity itself, can be accessed by handler
                });
            }
        }
      }
    });
  }


  // Synchronize render positions with physics body positions
  for (const id in entities) {
    if (entities[id].body && entities[id].renderer) {
      // The Player/Enemy components expect position to be top-left for the View
      // but Matter.js body.position is the center.
      // The components themselves adjust for this (e.g. left: position.x - size / 2)
      // So we just need to pass the center position.
      entities[id].position = { ...entities[id].body.position };
    }
  }

  return entities;
};

export default physicsSystem;
