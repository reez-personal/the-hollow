export interface Interactable {
  id: string
  tileX: number
  tileY: number
  type: 'note' | 'sign' | 'object'
  prompt: string        // What shows on the [E] prompt
  pages: string[]       // Text pages, press E to advance
}

export const INTERACTABLES: Interactable[] = [
  // ── Always visible / ambient ───────────────────────────────────────────────
  {
    id: 'missing_poster_1',
    tileX: 20, tileY: 12,
    type: 'sign',
    prompt: 'Missing person poster',
    pages: [
      'MISSING\n\nDANIEL FARROW\nAge: Unknown\nLast seen: Ashveil, November 3rd\n\nContact: Sheriff Cole, Ashveil',
      "You study the photograph.\n\nYou don't recognize him.\n\nBut something about the way he's standing —\nthe angle of the shoulders, the coat —\nmakes you feel like you've seen him in a mirror.",
    ],
  },
  {
    id: 'town_sign',
    tileX: 3, tileY: 13,
    type: 'sign',
    prompt: 'Town sign',
    pages: [
      "WELCOME TO ASHVEIL\nPopulation: 31\n\nBelow that, scratched in with a key:\n\n32\n\nBelow that, scratched over the 32:\n\n31",
    ],
  },
  {
    id: 'church_bulletin',
    tileX: 10, tileY: 9,
    type: 'sign',
    prompt: 'Church bulletin',
    pages: [
      'SUNDAY SERVICE\n2:00 AM\n\nWednesday Prayer\n3:00 AM\n\n"Come as you are."',
      'A handwritten note is pinned below:\n\n"He already knows you are coming."',
    ],
  },
  {
    id: 'diner_menu',
    tileX: 15, tileY: 12,
    type: 'object',
    prompt: 'Laminated menu',
    pages: [
      "ASHVEIL DINER\n\nBreakfast Special: $4.00\nHouse Coffee: $1.50\nThe Usual: $—\n\nWe are open until we aren't.",
      'Printed at the bottom, almost too small to read:\n\n"Prices effective as of March 2028."',
    ],
  },
  {
    id: 'edmund_ledger',
    tileX: 22, tileY: 12,
    type: 'object',
    prompt: 'Inventory ledger',
    pages: [
      'STOCK COUNT — GENERAL STORE\n\nApples: 7\nCandles: 31\nSomethings: 4\nDays remaining: 12\nThose who stayed: 6\nThose who are staying: 1',
    ],
  },
  {
    id: 'ruths_knitting',
    tileX: 22, tileY: 20,
    type: 'object',
    prompt: "Ruth's knitting",
    pages: [
      "A half-finished piece of knitting. Dark wool.\nThe pattern is intricate — almost like a map.\nOr a face.\n\nYou can't look at it directly.\nEvery time you try to focus, it shifts.",
    ],
  },
  {
    id: 'motel_register',
    tileX: 8, tileY: 22,
    type: 'object',
    prompt: 'Guest register',
    pages: [
      'GUEST REGISTER\n\nRoom 4: Lena Marsh — 3 weeks, outstanding balance\nRoom 3: Daniel Farrow — checked in Nov 2nd. Checked out: —\nRoom 1: Eli Cross — Arrived: Today',
      "The ink is dry.\nThe handwriting for Daniel Farrow's entry is not the clerk's.\n\nYou look at the handwriting.\nYou look at your own signature on the line above.\n\nYou don't look for long.",
    ],
  },

  // ── Quest-gated interactables ──────────────────────────────────────────────

  // Stage 3: payphone — requires matchbook_found
  {
    id: 'payphone',
    tileX: 15, tileY: 14,
    type: 'object',
    prompt: 'Payphone',
    // pages overridden dynamically in GameScene
    pages: [
      "An old payphone on the corner.\n\nYou don't have a reason to use it.\n\nYou keep walking.",
    ],
  },

  // Stage 4+: voice source — requires matchbook_found + payphone used
  {
    id: 'voice_source',
    tileX: 25, tileY: 28,
    type: 'object',
    prompt: 'Something in the dark',
    // pages overridden dynamically in GameScene based on voice_phase flag
    pages: [
      "You stop.\n\nThere is something at the edge of hearing.\n\nNot wind. Not rain.\n\nA voice. Distant. Fragmented.\n\nYou can't make out the words.\n\nBut it sounds like someone you know.",
    ],
  },

  // Stage 5+: cassette recorder — requires voice_phase >= 1
  {
    id: 'cassette_recorder',
    tileX: 27, tileY: 30,
    type: 'object',
    prompt: 'Cassette recorder',
    // pages overridden dynamically in GameScene based on voice_phase flag
    pages: [
      "An old cassette recorder, half-buried in wet leaves.\n\nYou press play.\n\nThere is static. Then silence.\n\nYou can't hear it yet.\n\nSomething is still drawing you further south.",
    ],
  },

  // Stage 7: the well — ONLY accessible after wallet_found (you know who you are)
  {
    id: 'the_well',
    tileX: 13, tileY: 11,
    type: 'object',
    prompt: 'The well',
    // pages overridden in GameScene for stage 7 revelation
    pages: [
      "You try to approach the well.\n\nYou find you can't.\n\nNot yet.\n\nNot until you understand what you're approaching.",
    ],
  },
]
