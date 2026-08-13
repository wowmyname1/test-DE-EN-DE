export const defaultAbilities = {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  wisdom: 10,
  constitution: 10,
  charisma: 10,
};

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const abilityModifier = (score) => {
  const numericScore = toNumber(score, 10);
  return Math.floor((numericScore - 10) / 2);
};

export const formatModifier = (modifier) => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export const ensureCharacterExtras = (character) => {
  return {
    ...character,
    description: character.description ?? '',
    abilities: {
      ...defaultAbilities,
      ...(character.abilities || {}),
    },
    quickRolls: Array.isArray(character.quickRolls)
      ? character.quickRolls
      : [],
  };
};
