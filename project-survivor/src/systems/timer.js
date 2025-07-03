import useGameStore from '../state/gameStore';

const MAX_GAME_TIME = 300; // 5 minutes in seconds

const timerSystem = (entities, { time, dispatch }) => {
  const { gameTime, isGameOver, incrementTime, setVictory } = useGameStore.getState();

  // Initialize timer state if not present (within any entity, or a dedicated one)
  // For simplicity, let's use a non-rendered entity if we need to store system-specific state.
  // Or, just use a variable in this system's scope if it's reset appropriately on game reset.
  // For this simple timer, direct calls to gameStore are fine.

  // The gameStore.incrementTime() is already defined to increment by 1 (second).
  // We need to call it every second.

  let timerState = entities.gameTimer;
  if (!timerState) {
    entities.gameTimer = {
      accumulatedDelta: 0,
    };
    timerState = entities.gameTimer;
  }

  if (isGameOver) {
    return entities; // Don't increment time or check for victory if game is already over
  }

  timerState.accumulatedDelta += time.delta;

  if (timerState.accumulatedDelta >= 1000) { // 1000ms = 1 second
    incrementTime();
    timerState.accumulatedDelta -= 1000; // Subtract one second, keep remainder for precision
  }

  // Check for victory condition
  // gameTime is updated by incrementTime, so we get the new value
  const currentGameTime = useGameStore.getState().gameTime; // Get fresh gameTime after potential increment
  if (currentGameTime >= MAX_GAME_TIME && !isGameOver) {
    setVictory();
  }

  return entities;
};

export default timerSystem;
