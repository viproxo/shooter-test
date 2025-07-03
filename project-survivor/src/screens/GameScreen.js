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

// physicsEngine and physicsWorld are defined outside as module singletons
const physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
const physicsWorld = physicsEngine.world;

// Function to create initial entities, including a new player body
const createInitialEntities = () => {
  // Note: Matter.World.clear should be called before this in a reset sequence.
  const playerX = screenWidth / 2;
  const playerY = screenHeight / 2;

  const newPlayerBody = Matter.Bodies.circle(
    playerX,
    playerY,
    PLAYER_SIZE / 2,
    { label: 'player', isStatic: false, frictionAir: 0.05 }
  );
  Matter.World.add(physicsWorld, [newPlayerBody]); // Add new player body to the world

  return {
    physics: {
      engine: physicsEngine,
      world: physicsWorld,
    },
    player: {
      body: newPlayerBody,
      size: PLAYER_SIZE,
      renderer: <Player />,
      position: { x: playerX, y: playerY },
    },
    gameTimer: { accumulatedDelta: 0 },
  };
};


const GameScreen = () => {
  const {
    isPaused,
    isGameOver,
    playerHP,
    playerWon,
    setJoystickVector,
    takeDamage,
    addXP,
    availableSkillsForLevelUp = [], // Default to empty array
    setAvailableSkills,
    activeWeapons,
    passiveSkills,
    resetGame: resetGameStore,
  } = useGameStore();

  const [gameKey, setGameKey] = React.useState(0);
  const [entities, setEntities] = React.useState(createInitialEntities);

  React.useEffect(() => {
    // This effect handles the actual game reset logic when isGameOver changes from true to false
    // (which happens after resetGameStore is called and store is reset)
    // It also ensures initial setup of the world is clean if gameKey is 0 (initial mount)
    if (gameKey > 0 || (gameKey === 0 && !isGameOver)) { // gameKey > 0 for reset, or initial setup
      Matter.World.clear(physicsWorld, false); // false to keep static bodies if any
      Matter.Engine.clear(physicsEngine);
      // Note: createInitialEntities will re-add player body
      setEntities(createInitialEntities());
    }
  }, [gameKey]); // Rerun when gameKey changes (due to reset)


  const handleActualReset = () => {
    resetGameStore(); // Reset Zustand store first
    setGameKey(prevKey => prevKey + 1); // Increment key to trigger re-mount of GameEngine and re-init of entities
  };


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

  // The actual playerBody and initialEntities are now managed by useState and createInitialEntities.
  // Matter.World.add for playerBody is handled within createInitialEntities.

  const gameSystems = React.useMemo(() => [
    movementSystem, spawnerSystem, physicsSystem, attacksSystem, timerSystem
  ], []);

  // onEvent handler now uses 'entities' from GameScreen's state
  const onGameEngineEvent = (eventArg) => {
    if (!eventArg || !eventArg.type) return;

    // Use 'entities' from GameScreen's state directly
    if (eventArg.type === 'player-hit-enemy') {
      const enemyDetails = eventArg.enemyDetails;
      if (enemyDetails && enemyDetails.damage) {
        takeDamage(enemyDetails.damage);
      }
    } else if (eventArg.type === 'projectile-hit-enemy' || eventArg.type === 'guardian-hit-enemy' || eventArg.type === 'lightning-hit-enemy') {
      const enemyEntity = entities[eventArg.enemyEntityId]; // Use 'entities' from state
      let damageDealt = 0;
      let projectileToRemove = null;

      if (!enemyEntity || !enemyEntity.details) return;

      if (eventArg.type === 'projectile-hit-enemy') { // Corrected: eventArg.type
        const projectileEntity = entities[eventArg.projectileEntityId]; // Use 'entities' from state
        if (projectileEntity && projectileEntity.damage) {
          damageDealt = projectileEntity.damage;
          projectileToRemove = projectileEntity; // Storing the entity to get its body
        }
      } else if (eventArg.type === 'guardian-hit-enemy') { // Corrected: eventArg.type
        const orbEntity = entities[eventArg.orbEntityId]; // Use 'entities' from state
        if (orbEntity && orbEntity.damage) {
          damageDealt = orbEntity.damage;
        }
      } else if (eventArg.type === 'lightning-hit-enemy') { // Corrected: eventArg.type
        damageDealt = eventArg.damage || 0;
      }

      if (damageDealt > 0) {
        enemyEntity.details.hp -= damageDealt;
      }

      if (projectileToRemove && projectileToRemove.body) { // Check if body exists
        Matter.World.remove(physicsWorld, projectileToRemove.body);
        delete entities[eventArg.projectileEntityId]; // Use 'entities' from state
      }

      if (enemyEntity.details.hp <= 0) {
        if (enemyEntity.body) { // Check if body exists before removing
            Matter.World.remove(physicsWorld, enemyEntity.body);
        }
        delete entities[eventArg.enemyEntityId]; // Use 'entities' from state
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
        entities={entities} // Use state for entities
        onEvent={onGameEngineEvent} // GameEngine provides entities in the second arg of event handler
      />
      <GameHUD />
      <Joystick onMove={setJoystickVector} /> {/* Directly use setJoystickVector from store */}

      {/* Skill Choice Modal */}
      {isPaused && availableSkillsForLevelUp.length > 0 && !isGameOver && <SkillChoiceModal />}

      {isGameOver && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>
            {playerWon ? 'VICTORY!' : 'GAME OVER'}
          </Text>
          {/* Display score and time if needed */}
          {/* <Text style={styles.finalScoreText}>Time: {gameTime}</Text> */}
          {/* <Text style={styles.finalScoreText}>Score: {score}</Text> */}
          <TouchableOpacity style={styles.playAgainButton} onPress={handleActualReset}>
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
