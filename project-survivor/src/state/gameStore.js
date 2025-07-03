import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  isPaused: false,
  isGameOver: false,
  score: 0,
  gameTime: 0,
  playerLevel: 1,
  playerXP: 0,
  playerMaxXP: 100,
  playerHP: 100,
  playerMaxHP: 100,
  initialPlayerMaxHP: 100, // Store initial for percentage buffs
  playerSpeed: 5,
  initialPlayerSpeed: 5, // Store initial for percentage buffs
  joystickVector: { x: 0, y: 0 },
  damageModifier: 1.0, // Global damage multiplier

  activeWeapons: ['pistol'],
  passiveSkills: [],
  availableSkillsForLevelUp: [],
  playerWon: false, // To distinguish victory from defeat

  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  addXP: (amount) => {
    const state = get();
    let newXP = state.playerXP + amount;
    let newLevel = state.playerLevel;
    let newMaxXP = state.playerMaxXP;
    let shouldPauseForLevelUp = false;

    while (newXP >= newMaxXP) {
      newLevel++;
      newXP -= newMaxXP;
      newMaxXP = Math.floor(newMaxXP * 1.5);
      shouldPauseForLevelUp = true; // Signal level up occurred
    }

    if (shouldPauseForLevelUp) {
      set({
        playerXP: newXP,
        playerLevel: newLevel,
        playerMaxXP: newMaxXP,
        isPaused: true, // Pause game for skill selection
        availableSkillsForLevelUp: [], // Clear old skills, GameScreen will populate
      });
    } else {
      set({ playerXP: newXP });
    }
  },

  takeDamage: (amount) => {
    const state = get();
    if (state.isGameOver) return; // Don't take damage if game is already over

    let newHP = state.playerHP - amount;
    let newIsGameOver = state.isGameOver; // Keep existing isGameOver state unless HP drops to 0
    let newIsPaused = state.isPaused;   // Keep existing isPaused state unless HP drops to 0

    if (newHP <= 0) {
      newHP = 0;
      newIsGameOver = true;
      newIsPaused = true; // Pause on defeat
      // playerWon remains false by default as this is HP loss scenario
    }
    set({ playerHP: newHP, isGameOver: newIsGameOver, isPaused: newIsPaused });
  },

  setPaused: (paused) => set({ isPaused: paused }),

  incrementTime: () => set((state) => ({ gameTime: state.gameTime + 1 })),

  setJoystickVector: (vector) => set({ joystickVector: vector }),

  setAvailableSkills: (skills) => set({ availableSkillsForLevelUp: skills }),

  selectSkill: (skill) => {
    // If skill is null or undefined (e.g. from auto-unpause if no skills were available)
    if (!skill) {
      // Only unpause if it was paused for skill selection.
      // If it was paused for other reasons (e.g. manual pause), don't unpause.
      // We identify skill selection pause by availableSkillsForLevelUp being non-empty.
      if (get().availableSkillsForLevelUp.length > 0) {
        set({ availableSkillsForLevelUp: [], isPaused: false });
      } else {
        // If paused for some other reason and skill is null, do nothing or only clear skills.
        set({ availableSkillsForLevelUp: [] });
      }
      return;
    }

    const state = get();
    if (skill.type === 'weapon') {
      if (!state.activeWeapons.includes(skill.id)) {
        set({ activeWeapons: [...state.activeWeapons, skill.id] });
      }
    } else if (skill.type === 'passive') {
      set((s) => {
        let newPlayerSpeed = s.playerSpeed;
        let newPlayerMaxHP = s.playerMaxHP;
        let newPlayerHP = s.playerHP;
        let newDamageModifier = s.damageModifier;

        if (skill.effect.target === 'damageModifier') {
          newDamageModifier = (s.damageModifier || 1.0) * (1 + skill.effect.value); // Multiplicative with previous modifiers
        }
        if (skill.effect.target === 'playerSpeed') {
          // Assuming percentage of initial speed. If additive to current, logic changes.
          newPlayerSpeed = s.playerSpeed * (1 + skill.effect.value);
        }
        if (skill.effect.target === 'playerMaxHP') {
          const hpIncrease = Math.floor(s.initialPlayerMaxHP * skill.effect.value);
          newPlayerMaxHP = s.playerMaxHP + hpIncrease;
          if (skill.effect.alsoHeal) {
            newPlayerHP = Math.min(s.playerHP + hpIncrease, newPlayerMaxHP);
          }
        }
        return {
          passiveSkills: [...s.passiveSkills, skill.id], // Could store whole skill object if needed
          playerSpeed: newPlayerSpeed,
          playerMaxHP: newPlayerMaxHP,
          playerHP: newPlayerHP,
          damageModifier: newDamageModifier,
        };
      });
    }
    // Resume game
    set({ availableSkillsForLevelUp: [], isPaused: false });
  },

  resetGame: () =>
    set({
      isPaused: false,
      isGameOver: false,
      score: 0,
      gameTime: 0,
      playerLevel: 1,
      playerXP: 0,
      playerMaxXP: 100,
      playerHP: 100,
      playerMaxHP: get().initialPlayerMaxHP,
      playerSpeed: get().initialPlayerSpeed,
      damageModifier: 1.0,
      activeWeapons: ['pistol'],
      passiveSkills: [],
      availableSkillsForLevelUp: [],
      playerWon: false, // Reset playerWon status
      joystickVector: { x: 0, y: 0 },
    }),
}));

export default useGameStore;
