export const STATUS_CATALOG = [
  {
    id: 'burning_custom',
    name: 'Горит (продвинутый)',
    icon: '🔥',
    color: '#e67e22',
    description: 'Начало хода: 1d6 урона огнём. Можно снять действием.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', event: 'turnStart' },
        {
          id: 2,
          type: 'action',
          action: 'damage',
          formula: '1d6',
          damageType: 'fire',
          parentId: 1,
        },
        {
          id: 3,
          type: 'trigger',
          event: 'manual',
          label: 'Потушить (действие)',
        },
        {
          id: 4,
          type: 'action',
          action: 'removeStatus',
          statusId: 'self',
          parentId: 3,
        },
      ],
    },
  },

  {
    id: 'regen_custom',
    name: 'Регенерация',
    icon: '💚',
    color: '#2ecc71',
    description: 'Начало хода: восстановление 5 HP. Снимается, если HP = HP max.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', event: 'turnStart' },
        {
          id: 2,
          type: 'action',
          action: 'heal',
          formula: '5',
          parentId: 1,
        },
        {
          id: 3,
          type: 'condition',
          check: 'hpPercent',
          op: '>=',
          value: 100,
          parentId: 2,
        },
        {
          id: 4,
          type: 'action',
          action: 'removeStatus',
          statusId: 'self',
          parentId: 3,
        },
      ],
    },
  },

  {
    id: 'low_hp_panic',
    name: 'Паника (низкие HP)',
    icon: '😱',
    color: '#9b59b6',
    description: 'Автоматически накладывается, если HP < 25%. Снимается при HP > 50%.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', event: 'turnStart' },
        {
          id: 2,
          type: 'condition',
          check: 'hpPercent',
          op: '<=',
          value: 25,
          parentId: 1,
        },
        {
          id: 3,
          type: 'condition',
          check: 'hasStatus',
          statusId: 'self',
          op: 'not',
          parentId: 2,
        },
        {
          id: 4,
          type: 'action',
          action: 'applyStatus',
          statusId: 'frightened',
          duration: 3,
          parentId: 3,
        },
        {
          id: 5,
          type: 'condition',
          check: 'hpPercent',
          op: '>=',
          value: 50,
          parentId: 1,
        },
        {
          id: 6,
          type: 'action',
          action: 'removeStatus',
          statusId: 'self',
          parentId: 5,
        },
      ],
    },
  },
];
