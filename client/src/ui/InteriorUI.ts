import { WorldState } from '../systems/WorldState'
import { ExamineUI } from './ExamineUI'

export type RoomId = 'motel_room_3' | 'diner' | 'church' | 'general_store' | 'motel_room_1'

interface RoomItem {
  label: string
  pages: string[]
  position: { top?: string; bottom?: string; left?: string; right?: string }
}

interface RoomDef {
  title: string
  description: string
  items: RoomItem[]
  specialFlag?: string
  questFlag?: string
  questEvent?: string
}

const ROOMS: Record<RoomId, RoomDef> = {
  motel_room_3: {
    title: 'Room 3',
    description: "The smell of damp paper and cigarette smoke.\nSomeone lived here recently.\nThe bed hasn't been slept in, but the sheets are pulled back.\nLike someone got up and didn't come back.",
    specialFlag: 'visited_room3',
    questFlag: 'clue_daniel_notes',
    questEvent: "Player searched Room 3. Found Daniel Farrow's notes.",
    items: [
      {
        label: "Notes pinned to the wall",
        position: { top: '28%', left: '12%' },
        pages: [
          "FIELD NOTES — D. FARROW\n\nDay 1: Town found. Population sign reads 32.\nCounted myself. There are 31 people here.\nSomeone is being counted that I cannot see.\n\nOr someone left while I was counting.",
          "Day 4: They all know my name.\nI didn't tell anyone my name.\n\nMaren called me by it when I walked in.\n'The usual, Daniel?' But I'd never been here.\n\nShe looked confused when I asked how she knew.",
          "Day 8: Found records in the town hall basement.\nEvery 31 years a new person arrives.\nThey stay for a season.\nThen the count goes back to 31.\n\nI asked Edmund what happened to them.\nHe started counting again from the beginning.",
          "Day 9: I know what I have to do.\nI know what they're waiting for.\n\nIf you're reading this:\nDon't let the count change.\nDon't become the 32nd.\n\n— D",
        ],
      },
      {
        label: "Strip of photographs",
        position: { top: '28%', right: '14%' },
        pages: [
          "A strip of four photographs taken in a booth.\n\nIn the first three, Daniel is grinning.\nPointing at something off-frame.\nLooking pleased with himself.\n\nIn the fourth photograph, he is looking directly at the camera.\nHe is not smiling.\nHe is mouthing something.",
          "You study the shape of his lips in the fourth photo.\n\nTwo words.\n\n'Run now.'",
        ],
      },
      {
        label: "The cracked window",
        position: { top: '50%', right: '10%' },
        pages: [
          "The crack runs from the bottom-left corner\nto the top-right in a single clean line.\n\nNot a break from impact.\nSomething pushed outward from inside.\n\nThe frame is bent the wrong way.",
          "There are finger marks in the dust on the sill.\nSmudged. Pointing out.\n\nOr clinging on.",
        ],
      },
      {
        label: "Under the bed",
        position: { bottom: '22%', left: '18%' },
        pages: [
          "You reach under the bed.\n\nA hardcover notebook, spiral-bound.\nWater-damaged. The cover reads:\n\n  31 → 32 → 31\n  IT CHOSE ME\n  it chose me\n  it chose me",
          "You open to a random page.\n\nEvery line is the same:\n\n  'I was not the 32nd. I was the door.'\n\nOver and over.\nForty-seven pages.",
        ],
      },
      {
        label: "The wall above the desk",
        position: { bottom: '22%', right: '16%' },
        pages: [
          "Daniel covered the wall with photographs, notes, and string.\n\nEverything connects to a central point:\na circle drawn in red pen labeled\n\n  'THE WELL'\n\n'It is not a well. It has always been a mouth.'",
          "One photo shows Ashveil from above.\nThe streets form a shape you didn't notice before.\n\nYou are not standing in a town.\n\nYou are standing in a letter.",
        ],
      },
    ],
  },

  motel_room_1: {
    title: 'Room 1 — Yours',
    description: "Your room.\nYou've slept here every night since you arrived.\nIt looks the same as you left it.\nSomething feels different about it now.",
    specialFlag: 'visited_room1',
    questFlag: 'wallet_found',
    questEvent: "Player found the wallet in Room 1. Identity revealed.",
    items: [
      {
        label: "The nightstand drawer",
        position: { top: '35%', left: '20%' },
        pages: [
          "You almost didn't open it.\n\nA wallet. Worn brown leather.\nYour name is on the ID inside.\n\nEli Cross. Your photograph. Your face.\n\nBut the name on the motel register below is Daniel Farrow.\n\nAnd you know what Daniel Farrow looks like.\n\nYou've been looking at his face all week.",
          "There is a note folded behind the ID.\n\nIn your handwriting.\n\n'You'll remember eventually. You always do.\nThis time, try to remember sooner.\n\nThe well is due. You know where it is.\nYou've been there before.\n\n— You.'",
        ],
      },
      {
        label: "Your coat on the door",
        position: { top: '35%', right: '20%' },
        pages: [
          "A coat hanging on the back of the door.\n\nHeavy. Dark. You've been wearing it this whole time.\n\nIn the inner pocket: a matchbook.\n\nA phone number is written inside in pencil.\nThe handwriting is yours.\n\nYou don't remember writing it.",
        ],
      },
      {
        label: "The mirror",
        position: { bottom: '28%', left: '50%', transform: 'translateX(-50%)' } as unknown as { top?: string; bottom?: string; left?: string; right?: string },
        pages: [
          "You look at yourself for a long time.\n\nYou don't look like someone who just arrived.\n\nYou look like someone who has been here a long time\nand forgotten they were ever anywhere else.",
        ],
      },
    ],
  },

  diner: {
    title: 'Ashveil Diner',
    description: "Still warm in here.\nThe coffee pot has been on so long the bottom is scorched.\nThere are two cups on the counter.\nOnly one of them has been used.",
    items: [
      {
        label: "Receipt under the cup",
        position: { top: '35%', left: '18%' },
        pages: [
          "A paper receipt, face-down.\n\nYou turn it over.\n\nDate: November 3rd.\nOrder: The Usual.\nCustomer name: DANIEL / ELI / DANIEL\n\nThe name has been written and crossed out twice.",
        ],
      },
      {
        label: "The coffee pot",
        position: { top: '35%', right: '18%' },
        pages: [
          "Still warm.\n\nIt's been warm every time you've come in.\n\nYou think about asking Maren how long it's been on.\n\nYou decide not to.",
        ],
      },
      {
        label: "Booth in the corner",
        position: { bottom: '28%', left: '22%' },
        pages: [
          "The booth in the far corner.\n\nSomeone sat here for a long time.\nThe vinyl is worn through on one side.\n\nThere are scratch marks on the table.\nLetters: D F.\n\nUnder that, smaller: E C.\n\nUnder that, smaller still: someone else entirely.",
        ],
      },
    ],
  },

  church: {
    title: 'The Church',
    description: "Cold in here, even in summer.\nThe pews face an altar that holds nothing.\nNo cross. No candles.\nJust a single wooden chair, facing the congregation.",
    items: [
      {
        label: "Open Bible on the pulpit",
        position: { top: '30%', left: '50%', transform: 'translateX(-50%)' } as unknown as { top?: string; bottom?: string; left?: string; right?: string },
        pages: [
          "Left open to a passage underlined in red:\n\n'And the number of them was thirty and two.'\n\nBelow that, handwritten in the margin:\n\n'32 enters. 32 is kept. 31 remains.'",
        ],
      },
      {
        label: "The confessional",
        position: { bottom: '28%', left: '18%' },
        pages: [
          "You open the door.\n\nSomething is written on the inside wall.\n\nThe same phrase, in six different handwritings:\n\n'I AM NOT THE FIRST.'",
        ],
      },
      {
        label: "Rows of tally marks",
        position: { bottom: '28%', right: '18%' },
        pages: [
          "Carved into the back of the last pew.\n\nTally marks.\nGroup after group of five.\n\nYou count them.\n\nThirty-one groups.\nThe thirty-second mark is a question.",
        ],
      },
    ],
  },

  general_store: {
    title: 'General Store',
    description: "The shelves are almost empty.\nWhat's left has been here long enough to gather dust.\nEdmund has been counting the same inventory\nfor as long as anyone can remember.",
    items: [
      {
        label: "Locked cabinet behind the counter",
        position: { top: '32%', left: '18%' },
        pages: [
          "A cabinet behind the counter.\n\nYou can see through the glass:\n\nBoxes, each labeled with a number and a name.\n\nARRIVAL KIT #32 — ELI CROSS\n\nIt was already there when you arrived.",
        ],
      },
      {
        label: "Handwritten inventory",
        position: { top: '32%', right: '18%' },
        pages: [
          "Handwritten list near the register.\n\nApples: 7\nCandles: 31\nDays remaining: 12\nThose who stayed: 6\nThose who are staying: 1",
        ],
      },
      {
        label: "Wall calendar",
        position: { bottom: '28%', left: '22%' },
        pages: [
          "A calendar pinned behind the register.\n\nEvery day has been crossed out\nexcept today.\n\nToday's date is circled in red.\n\nIn the margin, someone has written:\n\n'The last one always stays.'",
        ],
      },
    ],
  },
}

export class InteriorUI {
  private overlay: HTMLDivElement | null = null
  private examine = new ExamineUI()
  private worldState = WorldState.getInstance()
  private onExitCallback?: () => void

  open(roomId: RoomId, onExit?: () => void) {
    this.onExitCallback = onExit
    const room = ROOMS[roomId]
    if (!room) { onExit?.(); return }

    // Set flags
    if (room.specialFlag) void this.worldState.setFlag(room.specialFlag, 'true')
    if (room.questFlag)   void this.worldState.setFlag(room.questFlag, 'true')
    if (roomId === 'motel_room_1') {
      void this.worldState.setFlag('matchbook_found', 'true')
    }
    if (room.questEvent)  void this.worldState.logEvent(room.questEvent)

    this.build(room)
  }

  isOpen() { return !!this.overlay?.isConnected }

  private build(room: RoomDef) {
    this.overlay?.remove()

    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0',
      background: 'rgba(2,2,3,0.98)',
      zIndex: '7000',
      fontFamily: 'monospace',
      opacity: '0',
      transition: 'opacity 0.4s ease-in',
    })
    document.body.appendChild(overlay)
    this.overlay = overlay
    requestAnimationFrame(() => { overlay.style.opacity = '1' })

    // Top border line
    const borderLine = document.createElement('div')
    Object.assign(borderLine.style, {
      position: 'absolute', top: '0', left: '0', right: '0',
      height: '1px', background: '#1e1e1c',
    })
    overlay.appendChild(borderLine)

    // Room title
    const title = document.createElement('div')
    Object.assign(title.style, {
      position: 'absolute', top: '16px', left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '10px', letterSpacing: '5px', color: '#4a4840',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    })
    title.textContent = room.title
    overlay.appendChild(title)

    // Room description — centered, upper area
    const desc = document.createElement('div')
    Object.assign(desc.style, {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '12px', lineHeight: '1.9', color: '#6a6458',
      textAlign: 'center', whiteSpace: 'pre',
      pointerEvents: 'none',
      maxWidth: '480px',
    })
    desc.textContent = room.description
    overlay.appendChild(desc)

    // Items — positioned in screen space
    for (const item of room.items) {
      const btn = document.createElement('div')
      Object.assign(btn.style, {
        position: 'absolute',
        fontSize: '11px', color: '#555550',
        cursor: 'pointer', padding: '6px 0',
        transition: 'color 0.2s',
        userSelect: 'none',
        ...item.position,
      })
      btn.textContent = `[E]  ${item.label}`
      btn.onmouseenter = () => { btn.style.color = '#a09888' }
      btn.onmouseleave = () => { btn.style.color = '#555550' }
      btn.onclick = () => {
        this.examine.open(item.pages)
      }
      overlay.appendChild(btn)
    }

    // Exit hint
    const hint = document.createElement('div')
    Object.assign(hint.style, {
      position: 'absolute', bottom: '18px', right: '20px',
      fontSize: '9px', color: '#333330', letterSpacing: '1px',
    })
    hint.textContent = '[Esc] leave'
    overlay.appendChild(hint)

    // Horizontal rule above hint
    const rule = document.createElement('div')
    Object.assign(rule.style, {
      position: 'absolute', bottom: '0', left: '0', right: '0',
      height: '1px', background: '#111110',
    })
    overlay.appendChild(rule)

    const onKey = (e: KeyboardEvent) => {
      if (this.examine.isOpen()) return
      if (e.key === 'Escape' || e.key.toLowerCase() === 'f') {
        window.removeEventListener('keydown', onKey)
        this.close()
      }
    }
    window.addEventListener('keydown', onKey)
  }

  private close() {
    this.examine.close()
    if (this.overlay) {
      this.overlay.style.opacity = '0'
      setTimeout(() => {
        this.overlay?.remove()
        this.overlay = null
      }, 400)
    }
    this.onExitCallback?.()
    this.onExitCallback = undefined
  }
}
