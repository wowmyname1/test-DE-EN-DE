export const SPELL_CATALOG = [
  {
    id: 'fireball',
    name: 'Огненный шар',
    level: 3,
    school: 'Воплощение',
    castingTime: '1 действие',
    range: '150 футов',
    duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    icon: '🔥',
    description:
      'Яркий луч вспыхивает из вас к точке в пределах дистанции и взрывается огненным шаром.',
    logic: {
      targetMode: 'aoe',
      save: {
        ability: 'DEX',
        dcFormula: '8 + prof + mod',
      },
      onFail: {
        type: 'damage',
        formula: '8d6',
        damageType: 'fire',
      },
      onSuccess: {
        type: 'damage',
        formula: '4d6',
        damageType: 'fire',
      },
    },
  },

  {
    id: 'magic_missile',
    name: 'Волшебная стрела',
    level: 1,
    school: 'Воплощение',
    castingTime: '1 действие',
    range: '120 футов',
    duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    icon: '✨',
    description: 'Вы создаёте три светящихся дротика из магической силы.',
    logic: {
      targetMode: 'spread',
      save: null,
      onFail: {
        type: 'damage',
        formula: '1d4+1',
        damageType: 'force',
        count: 3,
      },
      onSuccess: null,
    },
  },

  {
    id: 'hold_person',
    name: 'Удержание личности',
    level: 2,
    school: 'Очарование',
    castingTime: '1 действие',
    range: '60 футов',
    duration: 'Концентрация, до 1 минуты',
    classes: ['Волшебник', 'Чародей', 'Бард', 'Жрец', 'Друид'],
    icon: '⛓️',
    description:
      'Цель должна преуспеть в спасброске Мудрости, иначе станет парализованной.',
    logic: {
      targetMode: 'single',
      save: {
        ability: 'WIS',
        dcFormula: '8 + prof + mod',
      },
      onFail: {
        type: 'applyStatus',
        statusId: 'paralyzed',
        duration: 10,
      },
      onSuccess: null,
    },
  },

  {
    id: 'cure_wounds',
    name: 'Лечение ран',
    level: 1,
    school: 'Воплощение',
    castingTime: '1 действие',
    range: 'Касание',
    duration: 'Мгновенная',
    classes: ['Жрец', 'Бард', 'Друид', 'Паладин', 'Следопыт'],
    icon: '💚',
    description:
      'Существо восстанавливает хиты равные 1d8 + модификатор заклинательной характеристики.',
    logic: {
      targetMode: 'single',
      save: null,
      onFail: {
        type: 'heal',
        formula: '1d8+3',
      },
      onSuccess: null,
    },
  },

  {
    id: 'lightning_bolt',
    name: 'Молния',
    level: 3,
    school: 'Проявление',
    castingTime: '1 действие',
    range: '100 футов (линия 100×5)',
    duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    icon: '⚡',
    description:
      'Разряд молнии длиной 100 футов и шириной 5 футов бьёт из вас.',
    logic: {
      targetMode: 'aoe',
      save: {
        ability: 'DEX',
        dcFormula: '8 + prof + mod',
      },
      onFail: {
        type: 'damage',
        formula: '8d6',
        damageType: 'lightning',
      },
      onSuccess: {
        type: 'damage',
        formula: '4d6',
        damageType: 'lightning',
      },
    },
  },

  {
    id: 'shield_spell',
    name: 'Щит',
    level: 1,
    school: 'Ограждение',
    castingTime: '1 реакция',
    range: 'На себя',
    duration: '1 раунд',
    classes: ['Волшебник', 'Чародей'],
    icon: '🛡️',
    description: 'Невидимый барьер магической силы появляется и защищает вас.',
    logic: {
      targetMode: 'single',
      selfOnly: true,
      save: null,
      onFail: {
        type: 'applyStatus',
        statusId: 'shield_of_faith',
        duration: 1,
        acBonus: 5,
      },
      onSuccess: null,
    },
  },
];
