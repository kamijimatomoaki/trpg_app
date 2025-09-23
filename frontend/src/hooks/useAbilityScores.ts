import { useState, useCallback } from 'react';

export interface AbilityScore {
  name: string;
  shortName: string;
  value: number;
  modifier: number;
}

export interface AbilityScores {
  strength: AbilityScore;
  dexterity: AbilityScore;
  intelligence: AbilityScore;
  constitution: AbilityScore;
  wisdom: AbilityScore;
  charisma: AbilityScore;
}

const ABILITY_NAMES = {
  strength: { name: '筋力', shortName: 'STR' },
  dexterity: { name: '敏捷', shortName: 'DEX' },
  intelligence: { name: '知力', shortName: 'INT' },
  constitution: { name: '体力', shortName: 'CON' },
  wisdom: { name: '精神', shortName: 'WIS' },
  charisma: { name: '魅力', shortName: 'CHA' }
};

// D&D5e style modifier calculation
const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// 3D6 dice roll (3-18)
const rollAbilityScore = (): number => {
  return Math.floor(Math.random() * 6) + 1 +
         Math.floor(Math.random() * 6) + 1 +
         Math.floor(Math.random() * 6) + 1;
};

const createAbilityScore = (key: keyof typeof ABILITY_NAMES, value: number): AbilityScore => ({
  name: ABILITY_NAMES[key].name,
  shortName: ABILITY_NAMES[key].shortName,
  value,
  modifier: calculateModifier(value)
});

export const useAbilityScores = () => {
  const [scores, setScores] = useState<AbilityScores>(() => {
    // 初期化時に全ての能力値をロール
    return {
      strength: createAbilityScore('strength', rollAbilityScore()),
      dexterity: createAbilityScore('dexterity', rollAbilityScore()),
      intelligence: createAbilityScore('intelligence', rollAbilityScore()),
      constitution: createAbilityScore('constitution', rollAbilityScore()),
      wisdom: createAbilityScore('wisdom', rollAbilityScore()),
      charisma: createAbilityScore('charisma', rollAbilityScore())
    };
  });

  const [rollingStates, setRollingStates] = useState<Record<keyof AbilityScores, boolean>>({
    strength: false,
    dexterity: false,
    intelligence: false,
    constitution: false,
    wisdom: false,
    charisma: false
  });

  // 振り直し回数制限
  const [rollCounts, setRollCounts] = useState<Record<keyof AbilityScores | 'all', number>>({
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    constitution: 0,
    wisdom: 0,
    charisma: 0,
    all: 0
  });

  const MAX_INDIVIDUAL_ROLLS = 3; // 個別振り直し上限
  const MAX_ALL_ROLLS = 2; // 全体振り直し上限

  const rollSingleAbility = useCallback((ability: keyof AbilityScores) => {
    if (rollCounts[ability] >= MAX_INDIVIDUAL_ROLLS) return;
    
    setRollingStates(prev => ({ ...prev, [ability]: true }));
    setRollCounts(prev => ({ ...prev, [ability]: prev[ability] + 1 }));
    
    setTimeout(() => {
      const newValue = rollAbilityScore();
      setScores(prev => ({
        ...prev,
        [ability]: createAbilityScore(ability, newValue)
      }));
      setRollingStates(prev => ({ ...prev, [ability]: false }));
    }, 1000);
  }, [rollCounts]);

  const rollAllAbilities = useCallback(() => {
    if (rollCounts.all >= MAX_ALL_ROLLS) return;
    
    // 全ての能力値のローリングを開始
    setRollingStates({
      strength: true,
      dexterity: true,
      intelligence: true,
      constitution: true,
      wisdom: true,
      charisma: true
    });

    setRollCounts(prev => ({ ...prev, all: prev.all + 1 }));

    // 各能力値を少しずつ時間差でロール（視覚効果のため）
    const abilities: (keyof AbilityScores)[] = ['strength', 'dexterity', 'intelligence', 'constitution', 'wisdom', 'charisma'];
    
    abilities.forEach((ability, index) => {
      setTimeout(() => {
        const newValue = rollAbilityScore();
        setScores(prev => ({
          ...prev,
          [ability]: createAbilityScore(ability, newValue)
        }));
        setRollingStates(prev => ({ ...prev, [ability]: false }));
      }, 800 + (index * 200)); // 0.8秒後から0.2秒間隔で順次完了
    });
  }, [rollCounts]);

  const getTotalScore = useCallback(() => {
    return Object.values(scores).reduce((total, score) => total + score.value, 0);
  }, [scores]);

  const getTotalModifier = useCallback(() => {
    return Object.values(scores).reduce((total, score) => total + score.modifier, 0);
  }, [scores]);

  const getScoreQuality = useCallback(() => {
    const total = getTotalScore();
    if (total >= 90) return { level: 'exceptional', description: '例外的な能力', color: '#4caf50' };
    if (total >= 80) return { level: 'excellent', description: '優秀な能力', color: '#2196f3' };
    if (total >= 70) return { level: 'good', description: '良好な能力', color: '#ff9800' };
    if (total >= 60) return { level: 'average', description: '平均的な能力', color: '#9e9e9e' };
    return { level: 'below_average', description: '平均以下の能力', color: '#f44336' };
  }, [getTotalScore]);

  const shouldRecommendReroll = useCallback(() => {
    const total = getTotalScore();
    const hasVeryLowScore = Object.values(scores).some(score => score.value <= 6);
    return total < 60 || hasVeryLowScore;
  }, [scores, getTotalScore]);

  const canRollIndividual = useCallback((ability: keyof AbilityScores) => {
    return rollCounts[ability] < MAX_INDIVIDUAL_ROLLS;
  }, [rollCounts]);

  const canRollAll = useCallback(() => {
    return rollCounts.all < MAX_ALL_ROLLS;
  }, [rollCounts]);

  const getRemainingRolls = useCallback((ability: keyof AbilityScores) => {
    return MAX_INDIVIDUAL_ROLLS - rollCounts[ability];
  }, [rollCounts]);

  const getRemainingAllRolls = useCallback(() => {
    return MAX_ALL_ROLLS - rollCounts.all;
  }, [rollCounts]);

  return {
    scores,
    rollingStates,
    rollSingleAbility,
    rollAllAbilities,
    getTotalScore,
    getTotalModifier,
    getScoreQuality,
    shouldRecommendReroll,
    canRollIndividual,
    canRollAll,
    getRemainingRolls,
    getRemainingAllRolls,
    MAX_INDIVIDUAL_ROLLS,
    MAX_ALL_ROLLS
  };
};