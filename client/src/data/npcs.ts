export interface NPCClientData {
  id: string
  displayName: string
  spriteKey: string
  spawnTile: [number, number]
  initialGreeting: string
}

export const NPC_DATA: Record<string, NPCClientData> = {
  // ── The six core narrative NPCs ──────────────────────────────────────────────
  maren: {
    id: 'maren',
    displayName: 'Maren',
    spriteKey: 'npc_maren',
    spawnTile: [12, 13],
    initialGreeting: "You're not from here.",
  },
  father_crale: {
    id: 'father_crale',
    displayName: 'Father Crale',
    spriteKey: 'npc_father_crale',
    spawnTile: [5, 9],
    initialGreeting: 'The hour is late.',
  },
  edmund: {
    id: 'edmund',
    displayName: 'Edmund',
    spriteKey: 'npc_edmund',
    spawnTile: [20, 11],
    initialGreeting: 'Thirty-one. Thirty-two.',
  },
  ruth: {
    id: 'ruth',
    displayName: 'Ruth',
    spriteKey: 'npc_ruth',
    spawnTile: [22, 17],
    initialGreeting: 'I wondered when you would come by.',
  },
  the_boy: {
    id: 'the_boy',
    displayName: '???',
    spriteKey: 'npc_the_boy',
    spawnTile: [44, 8],
    initialGreeting: 'Do you know why you came here?',
  },
  lena: {
    id: 'lena',
    displayName: 'Lena',
    spriteKey: 'npc_lena',
    spawnTile: [8, 21],
    initialGreeting: "I knew you'd come back.",
  },

  // ── Town officials ───────────────────────────────────────────────────────────
  sheriff_cole: {
    id: 'sheriff_cole',
    displayName: 'Sheriff Cole',
    spriteKey: 'npc_sheriff',
    spawnTile: [26, 10],
    initialGreeting: "Just passing through? Good.",
  },
  doc_havel: {
    id: 'doc_havel',
    displayName: 'Dr. Havel',
    spriteKey: 'npc_doctor',
    spawnTile: [18, 17],
    initialGreeting: "You look like you haven't slept.",
  },
  vera_marsh: {
    id: 'vera_marsh',
    displayName: 'Vera',
    spriteKey: 'npc_townswoman_a',
    spawnTile: [20, 12],
    initialGreeting: "I keep records. Everyone comes through here eventually.",
  },

  // ── Town residents ───────────────────────────────────────────────────────────
  hal_tuttle: {
    id: 'hal_tuttle',
    displayName: 'Hal',
    spriteKey: 'npc_townsman_a',
    spawnTile: [4, 18],
    initialGreeting: "You need something fixed?",
  },
  nan_bly: {
    id: 'nan_bly',
    displayName: 'Nan',
    spriteKey: 'npc_townswoman_b',
    spawnTile: [5, 23],
    initialGreeting: "Oh. I thought you were someone else.",
  },
  silas_reed: {
    id: 'silas_reed',
    displayName: 'Silas',
    spriteKey: 'npc_townsman_b',
    spawnTile: [33, 6],
    initialGreeting: "Road's long. Town doesn't get many strangers.",
  },
  opal_wren: {
    id: 'opal_wren',
    displayName: 'Opal',
    spriteKey: 'npc_townswoman_a',
    spawnTile: [39, 7],
    initialGreeting: "Come in. I made too much.",
  },
  cass_dolby: {
    id: 'cass_dolby',
    displayName: 'Cass',
    spriteKey: 'npc_townswoman_b',
    spawnTile: [45, 6],
    initialGreeting: "You're the one staying in the motel.",
  },
  tom_finch: {
    id: 'tom_finch',
    displayName: 'Tom',
    spriteKey: 'npc_townsman_a',
    spawnTile: [31, 17],
    initialGreeting: "Used to work the mill. Before.",
  },
  ida_crane: {
    id: 'ida_crane',
    displayName: 'Ida',
    spriteKey: 'npc_elder_woman',
    spawnTile: [44, 12],
    initialGreeting: "You remind me of someone.",
  },
  mr_poole: {
    id: 'mr_poole',
    displayName: 'Mr. Poole',
    spriteKey: 'npc_elder_man',
    spawnTile: [23, 5],
    initialGreeting: "I used to teach every child in this town.",
  },
  grace_holt: {
    id: 'grace_holt',
    displayName: 'Grace',
    spriteKey: 'npc_townswoman_a',
    spawnTile: [48, 17],
    initialGreeting: "The rooms fill up around this time of year.",
  },
  pete_sykes: {
    id: 'pete_sykes',
    displayName: 'Pete',
    spriteKey: 'npc_townsman_b',
    spawnTile: [9, 28],
    initialGreeting: "Quiet out here, isn't it.",
  },
  nora_ash: {
    id: 'nora_ash',
    displayName: 'Nora',
    spriteKey: 'npc_townswoman_b',
    spawnTile: [5, 31],
    initialGreeting: "My husband used to say the same thing you're thinking.",
  },
  ward_gibbs: {
    id: 'ward_gibbs',
    displayName: 'Ward',
    spriteKey: 'npc_townsman_a',
    spawnTile: [33, 12],
    initialGreeting: "Station's closed. Has been for a while.",
  },
  theo_vale: {
    id: 'theo_vale',
    displayName: 'Theo',
    spriteKey: 'npc_townsman_b',
    spawnTile: [22, 23],
    initialGreeting: "I've been trying to leave for months.",
  },
  bess_moon: {
    id: 'bess_moon',
    displayName: 'Bess',
    spriteKey: 'npc_townswoman_a',
    spawnTile: [17, 29],
    initialGreeting: "I've brought almost everyone in this town into the world.",
  },
  arlo_crane: {
    id: 'arlo_crane',
    displayName: 'Arlo',
    spriteKey: 'npc_townsman_a',
    spawnTile: [22, 29],
    initialGreeting: "...",
  },
  miller_cross: {
    id: 'miller_cross',
    displayName: 'Miller',
    spriteKey: 'npc_townsman_b',
    spawnTile: [44, 23],
    initialGreeting: "The mill's been quiet. Not sure why.",
  },
  agnes_fell: {
    id: 'agnes_fell',
    displayName: 'Agnes',
    spriteKey: 'npc_elder_woman',
    spawnTile: [9, 36],
    initialGreeting: "The bees stopped making honey three cycles ago.",
  },
  sam_pitch: {
    id: 'sam_pitch',
    displayName: 'Sam',
    spriteKey: 'npc_townsman_a',
    spawnTile: [17, 36],
    initialGreeting: "I've been standing here a long time.",
  },
  clara_voss: {
    id: 'clara_voss',
    displayName: 'Clara',
    spriteKey: 'npc_townswoman_b',
    spawnTile: [17, 23],
    initialGreeting: "I used to have students. The children don't come anymore.",
  },
  reg_dunbar: {
    id: 'reg_dunbar',
    displayName: 'Reg',
    spriteKey: 'npc_townsman_b',
    spawnTile: [16, 13],
    initialGreeting: "Shop's been slow. Like everything else here.",
  },
  may_hollis: {
    id: 'may_hollis',
    displayName: 'May',
    spriteKey: 'npc_elder_woman',
    spawnTile: [11, 16],
    initialGreeting: "Nothing grows here the way it should.",
  },
}
