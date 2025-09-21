export type LevelInfo = {
  level: number; // 0 if below first threshold
  totalXp: number;
  currentLevelTotalRequired: number; // cumulative required to reach current level (start of level)
  nextLevelTotalRequired: number; // cumulative required to reach next level
  xpIntoLevel: number; // xp gained since reaching current level
  xpForNextLevel: number; // additional xp required to reach next level from current level start
  progress: number; // 0..1 progress within current level
};

// Level requirements: base for level 1, then +increment per level (arithmetic progression)
// Example: base=100, increment=25 -> L1 req 100, L2 req 125, L3 req 150, ...
export function computeLevel(totalXp: number, base = 100, increment = 25): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  let level = 0;
  let cumulative = 0; // cumulative XP needed to have reached current level
  let reqNext = base; // requirement to go from current to next level

  // Increase level while we have enough XP for the next level
  while (safeXp >= cumulative + reqNext) {
    cumulative += reqNext;
    level += 1;
    reqNext = base + increment * level; // next level requires +25 per level
  }

  const currentLevelTotalRequired = cumulative; // total needed to be at this level
  const nextLevelTotalRequired = cumulative + reqNext; // total needed for next level
  const xpIntoLevel = safeXp - cumulative;
  const xpForNextLevel = reqNext;
  const progress = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1;

  return {
    level,
    totalXp: safeXp,
    currentLevelTotalRequired,
    nextLevelTotalRequired,
    xpIntoLevel,
    xpForNextLevel,
    progress,
  };
}

