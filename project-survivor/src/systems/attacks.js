import Matter from 'matter-js';
import useGameStore from '../state/gameStore'; // Import gameStore
import { PISTOL, GUARDIAN_ORBITER, LIGHTNING_EMITTER, ALL_ABILITIES_MAP } from '../data/abilities';
import Projectile from '../components/game/Projectile';

let nextProjectileId = 0;
let nextGuardianOrbId = 0;
let nextLightningStrikeId = 0; // For temporary visual entities

const attacksSystem = (entities, { time, screen, dispatch }) => {
  const { activeWeapons, damageModifier } = useGameStore.getState();
  const player = entities.player;

  if (!player || !player.body) return entities;
  const world = entities.physics.world;

  // --- Pistol Logic ---
  if (activeWeapons.includes(PISTOL.id)) {
    if (!player.pistolCooldown) player.pistolCooldown = 0;
    if (player.pistolCooldown > 0) player.pistolCooldown -= time.delta;

    if (player.pistolCooldown <= 0) {
      let nearestEnemy = null;
      let minDistanceSq = Infinity;

      for (const id in entities) {
        if (entities[id].type === 'enemy' && entities[id].body) {
          const enemy = entities[id];
          const dx = enemy.body.position.x - player.body.position.x;
          const dy = enemy.body.position.y - player.body.position.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            nearestEnemy = enemy;
          }
        }
      }

      if (nearestEnemy) {
        const playerPos = player.body.position;
        const enemyPos = nearestEnemy.body.position;
        const directionX = enemyPos.x - playerPos.x;
        const directionY = enemyPos.y - playerPos.y;
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

        if (magnitude > 0) {
          const normDirX = directionX / magnitude;
          const normDirY = directionY / magnitude;
          const pistolData = ALL_ABILITIES_MAP['pistol']; // Get data from map

          const projectileId = `projectile_${nextProjectileId++}`;
          const projectileDamage = pistolData.damage * damageModifier; // Apply damage modifier

          const projectileBody = Matter.Bodies.circle(
            playerPos.x + normDirX * (player.size / 2 + pistolData.projectileSize / 2 + 5),
            playerPos.y + normDirY * (player.size / 2 + pistolData.projectileSize / 2 + 5),
            pistolData.projectileSize / 2,
            {
              label: pistolData.label,
              id: Matter.Common.nextId(),
              entityId: projectileId,
              frictionAir: 0, restitution: 0, density: 0.001, isSensor: false,
            }
          );
          Matter.Body.setVelocity(projectileBody, {
            x: normDirX * pistolData.projectileSpeed,
            y: normDirY * pistolData.projectileSpeed,
          });
          Matter.World.add(world, [projectileBody]);
          entities[projectileId] = {
            id: projectileId, body: projectileBody, renderer: <Projectile />,
            size: pistolData.projectileSize, color: pistolData.projectileColor,
            damage: projectileDamage, type: 'projectile',
          };
          player.pistolCooldown = pistolData.fireRate;
        }
      }
    }
  }

  // --- Guardian Orbiter Logic ---
  if (activeWeapons.includes(GUARDIAN_ORBITER.id)) {
    const orbiterData = ALL_ABILITIES_MAP['guardian'];
    if (!player.guardianOrbs) player.guardianOrbs = {}; // { orbId: { angle: 0, body: matterBody } }

    // Check if we need to spawn more orbs (e.g., up to maxOrbs)
    const currentOrbCount = Object.keys(player.guardianOrbs).length;
    if (currentOrbCount < (orbiterData.maxOrbs || 1)) { // Default to 1 orb if maxOrbs not defined
        const orbId = `guardian_${nextGuardianOrbId++}`;
        const orbBody = Matter.Bodies.circle(
            player.body.position.x + orbiterData.orbitRadius,
            player.body.position.y,
            orbiterData.size / 2,
            {
              label: orbiterData.label,
              id: Matter.Common.nextId(),
              entityId: orbId,
              isSensor: true, // Orbs damage on contact, don't physically push enemies
              frictionAir: 0,
            }
        );
        Matter.World.add(world, [orbBody]);
        entities[orbId] = {
            id: orbId, body: orbBody, renderer: <Projectile />, // Use Projectile renderer
            size: orbiterData.size, color: orbiterData.color,
            damage: orbiterData.damage * damageModifier, type: 'guardian_orb',
            isGuardianOrb: true, // Custom flag
        };
        player.guardianOrbs[orbId] = { angle: Math.random() * Math.PI * 2, body: orbBody }; // Random initial angle
    }

    // Update orb positions
    Object.keys(player.guardianOrbs).forEach(orbId => {
        const orbState = player.guardianOrbs[orbId];
        orbState.angle += orbiterData.rotationSpeed;
        const newX = player.body.position.x + orbiterData.orbitRadius * Math.cos(orbState.angle);
        const newY = player.body.position.y + orbiterData.orbitRadius * Math.sin(orbState.angle);
        Matter.Body.setPosition(orbState.body, { x: newX, y: newY });
        // Damage dealt by guardian orbs will be handled by physics collision (enemy vs guardian_orb)
    });
  }


  // --- Lightning Emitter Logic ---
  if (activeWeapons.includes(LIGHTNING_EMITTER.id)) {
    const lightningData = ALL_ABILITIES_MAP['lightning'];
    if (!player.lightningCooldown) player.lightningCooldown = lightningData.interval; // Start with full cooldown
    if (player.lightningCooldown > 0) player.lightningCooldown -= time.delta;

    if (player.lightningCooldown <= 0) {
      // Choose a random position near player (e.g., within a certain radius)
      const strikeRadius = 150; // How far from player lightning can strike
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * strikeRadius;
      const strikeX = player.body.position.x + Math.cos(angle) * distance;
      const strikeY = player.body.position.y + Math.sin(angle) * distance;

      // Create a temporary visual entity for the lightning strike
      const strikeId = `lightning_strike_effect_${nextLightningStrikeId++}`;
      entities[strikeId] = {
          id: strikeId,
          renderer: <Projectile />, // Use Projectile renderer for simplicity
          size: lightningData.areaSize,
          color: lightningData.color,
          position: { x: strikeX, y: strikeY },
          isTemporary: true,
          duration: 200, // ms for visual effect
      };

      // Damage enemies in area by dispatching events
      const lightningDamage = lightningData.damage * damageModifier;
      for (const id in entities) {
        if (entities[id].type === 'enemy' && entities[id].body) {
          const enemy = entities[id];
          const dx = enemy.body.position.x - strikeX;
          const dy = enemy.body.position.y - strikeY;
          if (Math.sqrt(dx * dx + dy * dy) < lightningData.areaSize / 2) {
            dispatch({
              type: 'lightning-hit-enemy',
              enemyEntityId: enemy.id, // The actual ID of the enemy entity
              damage: lightningDamage,
            });
          }
        }
      }
      player.lightningCooldown = lightningData.interval;
    }
  }

  // Cleanup temporary visual entities (like lightning strike effect)
  for (const id in entities) {
    if (entities[id].isTemporary) {
        entities[id].duration -= time.delta;
        if (entities[id].duration <= 0) {
            delete entities[id];
        }
    }
  }


  // Basic off-screen projectile cleanup (only for type 'projectile')
  for (const id in entities) {
    if (entities[id].type === 'projectile' && entities[id].body) { // Ensure it's a pistol projectile
      const proj = entities[id];
      const { x, y } = proj.body.position;
      if (x < -100 || x > screen.width + 100 || y < -100 || y > screen.height + 100) {
        Matter.World.remove(world, proj.body); // Remove from physics world
        delete entities[id]; // Remove from game entities
      }
    }
  }

  return entities;
};

export default attacksSystem;
