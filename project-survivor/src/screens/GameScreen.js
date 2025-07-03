import React from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import useGameStore from '../state/gameStore';
import GameHUD from '../components/ui/GameHUD';
import Player from '../components/game/Player';
import Joystick from '../components/ui/Joystick';
import movementSystem from '../systems/movement';
import spawnerSystem from '../systems/spawner';
import physicsSystem from '../systems/physics';
import attacksSystem from '../systems/attacks';
import SkillChoiceModal from '../components/ui/SkillChoiceModal';
import { ALL_ABILITIES_ARRAY } from '../data/abilities';
import timerSystem from '../systems/timer'; // Import timer system

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const PLAYER_SIZE = 50;

const physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
const physicsWorld = physicsEngine.world;

const GameScreen = () => {
  const {
    isPaused,
    isGameOver,
    playerHP, // Still used for conditional rendering text, though playerWon is primary
    playerWon, // For victory/defeat message
    // gameTime, // Not directly used in render, but HUD uses it
    setJoystickVector,
    // takeDamage, // Used by events
    // addXP, // Used by events
    availableSkillsForLevelUp,
    setAvailableSkills,
    activeWeapons,
    passiveSkills,
    resetGame, // For Play Again button
  } = useGameStore();

  React.useEffect(() => {
    // This effect runs when isPaused changes, specifically for level-up skill selection.
    if (isPaused && availableSkillsForLevelUp.length === 0 && !isGameOver) {
      // Game is paused for level up, and skills haven't been set yet.
      const currentSkillIds = [...activeWeapons, ...passiveSkills]; // Combine for filtering if needed

      // Filter out skills that shouldn't be offered again (e.g. unique weapons, maxed passives)
      // For Alpha, we'll keep it simple: filter out nothing or only exact duplicates for now.
      // More complex logic (maxStacks) can be added to ALL_ABILITIES_ARRAY items.
      const possibleChoices = ALL_ABILITIES_ARRAY.filter(skill => {
        // Example: don't offer pistol again if it's unique and already active
        // if (skill.id === 'pistol' && activeWeapons.includes('pistol') && skill.isUnique) return false;
        // Example: check maxStacks for passives
        // const existingStacks = passiveSkills.filter(sId => sId === skill.id).length;
        // if (skill.maxStacks && existingStacks >= skill.maxStacks) return false;
        return true;
      });

      const shuffled = [...possibleChoices].sort(() => 0.5 - Math.random());
      const selectedThree = shuffled.slice(0, Math.min(3, shuffled.length));

      if (selectedThree.length > 0) {
        setAvailableSkills(selectedThree);
      } else {
        // No skills available to choose (e.g., all acquired and maxed out)
        // This case should ideally unpause the game or offer a default reward.
        // For now, this might lead to a soft-lock if not handled by selectSkill eventually unpausing.
        // The selectSkill in gameStore currently always unpauses.
        // If setAvailableSkills is called with empty, modal won't show.
        // gameStore.isPaused should be set to false by some mechanism.
        // For now, if no skills, selectSkill won't be called, isPaused stays true.
        // Let's ensure selectSkill with a null/empty skill still unpauses, or add a button to modal.
        // The current gameStore.selectSkill will unpause. If no skills are set,
        // the modal won't show, and the game remains paused.
        // A simple fix: if selectedThree is empty, call selectSkill with a "dummy" no-op skill or unpause directly.
        useGameStore.setState({ isPaused: false }); // Force unpause if no skills to select
      }
    }
  }, [isPaused, availableSkillsForLevelUp, isGameOver, setAvailableSkills, activeWeapons, passiveSkills]);

  const playerBody = Matter.Bodies.circle(
    screenWidth / 2,
    screenHeight / 2,
    PLAYER_SIZE / 2,
    { label: 'player', isStatic: false, frictionAir: 0.05 } // frictionAir helps with stopping
  );

  const initialEntities = {
    physics: {
      engine: physicsEngine,
      world: physicsWorld,
    },
    player: {
      body: playerBody, // Matter.js body
      size: PLAYER_SIZE,
      renderer: <Player />,
      // position: { x: screenWidth / 2, y: screenHeight / 2 }, // Now derived from body
    },
    // Spawner entity will be initialized by the spawnerSystem itself
  };
  Matter.World.add(physicsWorld, [playerBody]);

  // Local entities reference for onGameEngineEvent closure.
  // This is tricky because systems modify the 'entities' object directly.
  // The 'entities' object passed to onEvent by GameEngine is the current one.
  let currentEntities = initialEntities;

  const gameSystems = [movementSystem, spawnerSystem, physicsSystem, attacksSystem, timerSystem]; // Added timerSystem

  const handleJoystickMove = (vector) => {
    setJoystickVector(vector);
  };

  const onGameEngineEvent = (e, entitiesFromEngine) => {
    // Use entitiesFromEngine for up-to-date entity states
    if (!entitiesFromEngine) entitiesFromEngine = currentEntities; // Fallback, though GameEngine should provide it

    if (e.type === 'player-hit-enemy') {
      const enemyDetails = e.enemyDetails;
      if (enemyDetails && enemyDetails.damage) {
        takeDamage(enemyDetails.damage);
      }
    } else if (e.type === 'projectile-hit-enemy' || e.type === 'guardian-hit-enemy' || e.type === 'lightning-hit-enemy') {
      const enemyEntity = entitiesFromEngine[e.enemyEntityId];
      let damageDealt = 0;
      let projectileToRemove = null; // For pistol projectiles

      if (!enemyEntity || !enemyEntity.details) return; // Enemy already gone or no details

      if (e.type === 'projectile-hit-enemy') {
        const projectileEntity = entitiesFromEngine[e.projectileEntityId];
        if (projectileEntity && projectileEntity.damage) {
          damageDealt = projectileEntity.damage;
          projectileToRemove = projectileEntity;
        }
      } else if (e.type === 'guardian-hit-enemy') {
        const orbEntity = entitiesFromEngine[e.orbEntityId];
        if (orbEntity && orbEntity.damage) {
          damageDealt = orbEntity.damage;
        }
      } else if (e.type === 'lightning-hit-enemy') { // Event from lightning system
        damageDealt = e.damage || 0;
      }

      if (damageDealt > 0) {
        enemyEntity.details.hp -= damageDealt;
      }

      if (projectileToRemove) {
        Matter.World.remove(physicsWorld, projectileToRemove.body);
        delete entitiesFromEngine[e.projectileEntityId];
      }

      if (enemyEntity.details.hp <= 0) {
        Matter.World.remove(physicsWorld, enemyEntity.body); // Ensure body is removed
        delete entitiesFromEngine[e.enemyEntityId];
        addXP(enemyEntity.details.xpValue || 10);
      }
    }
  };

  // Update currentEntities reference if entities prop changes (though it's usually mutated)
  // This is more of a conceptual note as GameEngine mutates the entities object.
  // The 'entities' passed to onEvent is the one to trust.

  return (
    <View style={styles.container}>
      <GameEngine
        style={styles.gameContainer}
        running={!isPaused && !isGameOver && availableSkillsForLevelUp.length === 0} // Also pause engine if modal is up
        systems={gameSystems}
        entities={initialEntities}
        onEvent={(e) => onGameEngineEvent(e, initialEntities)}
      />
      <GameHUD />
      <Joystick onMove={handleJoystickMove} />

      {/* Skill Choice Modal */}
      {isPaused && availableSkillsForLevelUp.length > 0 && !isGameOver && <SkillChoiceModal />}

      {isPaused && availableSkillsForLevelUp.length > 0 && !isGameOver && <SkillChoiceModal />}

      {isGameOver && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>
            {playerWon ? 'VICTORY!' : 'GAME OVER'}
          </Text>
          {/* Display score and time if needed */}
          {/* <Text style={styles.finalScoreText}>Time: {gameTime}</Text> */}
          {/* <Text style={styles.finalScoreText}>Score: {score}</Text> */}
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Play Again?</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
  },
  overlay: { // Styles for Game Over/Victory messages & SkillChoiceModal background
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly more opaque for game end
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: { // For "VICTORY!" / "GAME OVER"
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40, // Space for button
  },
  // finalScoreText: { // Optional: For showing final score/time
  //   fontSize: 22,
  //   color: 'white',
  //   marginBottom: 10,
  // },
  playAgainButton: {
    backgroundColor: '#555',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#777',
  },
  playAgainButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default GameScreen;
