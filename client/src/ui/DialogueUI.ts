import { DialogueManager } from '../systems/DialogueManager'
import { WorldState } from '../systems/WorldState'

const NPC_COLORS: Record<string, { accent: string; dim: string }> = {
  maren:        { accent: '#c8a060', dim: '#6a5028' },
  father_crale: { accent: '#8899bb', dim: '#303d55' },
  edmund:       { accent: '#a0a888', dim: '#3a3e2c' },
  ruth:         { accent: '#9988bb', dim: '#3a2e4a' },
  the_boy:      { accent: '#aaaacc', dim: '#2e2e44' },
  lena:         { accent: '#aa8899', dim: '#3e2e34' },
}
const DEFAULT_COLOR = { accent: '#aaaaaa', dim: '#333333' }

const CHOICES: Record<string, Array<{ label: string; text: string; trustDelta?: number }>> = {
  maren: [
    { label: 'About Daniel',        text: "A man named Daniel Farrow was here recently. Do you know where he went?",                                         trustDelta: -1 },
    { label: 'Have we met before?', text: "This might sound strange. But have we met before? Not recently. Before that. Before I came here.",                trustDelta:  1 },
    { label: 'The Usual',           text: "Someone told me I always order the same thing here. But I've never been to Ashveil. What do you know about that?", trustDelta:  0 },
    { label: 'You seem nervous.',   text: "You seem nervous around me. More than a stranger would make someone. Why?",                                         trustDelta: -1 },
  ],
  father_crale: [
    { label: 'About Daniel',           text: "I'm looking for Daniel Farrow. He mentioned the church in his notes. What happened to him here?",             trustDelta: -1 },
    { label: 'The Keeping',            text: "What is The Keeping? I keep hearing that phrase in this town. Nobody will explain it directly.",               trustDelta: -1 },
    { label: 'The count of 31',        text: "Why is it always 31? What happens to the 32nd person who arrives in this town?",                              trustDelta: -1 },
    { label: 'You were expecting me.', text: "You said the hour was late when you saw me. Like you were waiting. How long had you been waiting?",           trustDelta:  1 },
  ],
  edmund: [
    { label: 'What are you counting?', text: "What are you always counting? I've watched you. You never stop.",                                               trustDelta:  0 },
    { label: 'About Daniel',           text: "Tell me about Daniel Farrow. Everything you remember about him. Don't leave anything out.",                    trustDelta: -1 },
    { label: 'Do you recognize me?',   text: "Look at me carefully. Do you recognize me? Not as Eli. From before. Have you seen my face before?",           trustDelta: -1 },
    { label: 'The arrival kits',       text: "I found a locked cabinet in the store with boxes labeled 'ARRIVAL KIT #32'. One has my name on it.",          trustDelta: -2 },
  ],
  ruth: [
    { label: 'What are you knitting?',  text: "What are you making? I keep looking at it and it looks like a face. Or a map. Whose face is it?",            trustDelta:  1 },
    { label: 'You were watching me.',   text: "You were watching me before I came over. Before I even arrived. How long had you been waiting?",             trustDelta:  1 },
    { label: 'About Daniel',            text: "The man who stayed in room 3. Daniel Farrow. You knew him. I can tell. What happened to him?",               trustDelta: -1 },
    { label: 'Someone was here before.',text: "Someone like me has been here before. I can see it in how you look at me. What happened to them?",           trustDelta:  1 },
  ],
  the_boy: [
    { label: 'What is your name?',      text: "What's your name? Where are your parents?",                                                                   trustDelta:  1 },
    { label: 'Why are you alone?',      text: "Why are you out here alone? Aren't you afraid of this place?",                                                trustDelta:  0 },
    { label: 'About Daniel',            text: "Did you know the man who was staying at the motel? His name was Daniel. Did you ever speak to him?",         trustDelta:  0 },
    { label: 'Have you seen me before?',text: "Have you seen me before? Before I came here this time. Has someone like me been here before?",               trustDelta: -1 },
  ],
  lena: [
    { label: 'You know me.',         text: "You know who I am. Not my name — you know me. I can see it in your face. Tell me.",                             trustDelta:  2 },
    { label: 'About Daniel',         text: "You were his neighbor. Room 3. You heard things through the wall. What did you hear?",                          trustDelta: -1 },
    { label: 'My voice',             text: "Has anyone ever told you I have a familiar voice? Someone you knew. Someone with a voice like mine.",            trustDelta:  1 },
    { label: 'Help me understand.',  text: "I found something. A recording. I need you to tell me what you know. All of it. Please.",                       trustDelta:  2 },
  ],
}

const DEFAULT_CHOICES = [
  { label: 'What is this place?', text: 'What is this place? Something feels wrong here.',                  trustDelta:  0 },
  { label: 'Do you know me?',     text: 'Do you know who I am? Have I been here before?',                  trustDelta:  0 },
  { label: 'About Daniel Farrow', text: "I'm looking for a man named Daniel Farrow. Have you seen him?",   trustDelta: -1 },
]

export class DialogueUI {
  private manager = new DialogueManager()
  private worldState = WorldState.getInstance()

  private panel!: HTMLDivElement
  private accentBar!: HTMLDivElement
  private nameEl!: HTMLDivElement
  private relEl!: HTMLDivElement
  private textEl!: HTMLDivElement
  private choicesEl!: HTMLDivElement
  private hintEl!: HTMLDivElement
  private inputEl: HTMLInputElement | null = null

  private npcId = ''
  private playerName = 'Eli Cross'
  private currentRelationship = 0
  private pendingTrustDelta = 0
  private pendingFollowRequest = false
  private pendingStopFollow = false

  private displayedText = ''
  private pendingTokens = ''
  private typewriterInterval?: ReturnType<typeof setInterval>
  private state: 'idle' | 'speaking' | 'waiting' = 'idle'

  private onCloseCallback?: (followReq: boolean, stopFollow: boolean, npcId: string) => void
  private boundEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') this.close() }

  open(
    npcId: string,
    displayName: string,
    greeting: string,
    onClose?: (followReq: boolean, stopFollow: boolean, npcId: string) => void,
  ) {
    this.npcId = npcId
    this.onCloseCallback = onClose
    this.pendingFollowRequest = false
    this.pendingStopFollow = false
    this.pendingTrustDelta = 0
    const savedName = this.worldState.getFlag('player_name')
    if (savedName) this.playerName = savedName
    this.currentRelationship = this.worldState.getRelationship(npcId)

    const colors = NPC_COLORS[npcId] ?? DEFAULT_COLOR
    this.buildPanel(displayName, colors)
    window.addEventListener('keydown', this.boundEsc)

    void this.connectAndGreet(greeting)
  }

  isOpen() { return !!this.panel?.isConnected }

  private buildPanel(displayName: string, colors: { accent: string; dim: string }) {
    this.panel?.remove()

    this.panel = document.createElement('div')
    Object.assign(this.panel.style, {
      position: 'fixed',
      left: '0', bottom: '0', width: '100%', height: '200px',
      background: 'rgba(8,8,8,0.97)',
      borderTop: '1px solid #1a1a18',
      boxSizing: 'border-box',
      zIndex: '8000',
      overflow: 'hidden',
    })

    this.accentBar = document.createElement('div')
    Object.assign(this.accentBar.style, {
      position: 'absolute', top: '0', left: '0',
      height: '2px', width: '0%', background: colors.accent,
      transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
    })
    this.panel.appendChild(this.accentBar)
    requestAnimationFrame(() => { this.accentBar.style.width = '100%' })

    this.nameEl = document.createElement('div')
    Object.assign(this.nameEl.style, {
      position: 'absolute', top: '12px', left: '20px',
      fontFamily: 'monospace', fontSize: '11px', letterSpacing: '3px',
      color: colors.accent, textTransform: 'uppercase',
    })
    this.nameEl.textContent = displayName
    this.panel.appendChild(this.nameEl)

    this.relEl = document.createElement('div')
    Object.assign(this.relEl.style, {
      position: 'absolute', top: '14px', right: '20px',
      fontFamily: 'monospace', fontSize: '9px', color: '#555548',
      fontStyle: 'italic', opacity: '0', transition: 'opacity 0.6s',
    })
    this.panel.appendChild(this.relEl)
    this.updateRelIndicator()

    this.textEl = document.createElement('div')
    Object.assign(this.textEl.style, {
      position: 'absolute', top: '34px', left: '20px', right: '20px',
      fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.65',
      color: '#e8e4de', whiteSpace: 'pre-wrap',
    })
    this.panel.appendChild(this.textEl)

    this.choicesEl = document.createElement('div')
    Object.assign(this.choicesEl.style, {
      position: 'absolute', top: '120px', left: '20px', right: '20px',
      display: 'flex', gap: '10px', flexWrap: 'wrap',
    })
    this.panel.appendChild(this.choicesEl)

    this.hintEl = document.createElement('div')
    Object.assign(this.hintEl.style, {
      position: 'absolute', bottom: '10px', right: '14px',
      fontFamily: 'monospace', fontSize: '9px', color: '#888882',
    })
    this.hintEl.textContent = '[Esc] leave'
    this.panel.appendChild(this.hintEl)

    document.body.appendChild(this.panel)
  }

  private async connectAndGreet(greeting: string) {
    this.manager.onToken(tok => { this.pendingTokens += tok })
    this.manager.onTurnEnd(full => {
      this.pendingTokens = ''
      clearInterval(this.typewriterInterval)
      this.displayedText = full ?? this.displayedText
      this.textEl.textContent = this.displayedText
      this.state = 'waiting'

      if (this.pendingTrustDelta !== 0) {
        const delta = this.pendingTrustDelta
        this.pendingTrustDelta = 0
        this.currentRelationship = Math.max(-3, Math.min(3, this.currentRelationship + delta))
        void this.worldState.adjustRelationship(this.npcId, delta)
        this.updateRelIndicator()
      }
      setTimeout(() => this.showChoices(), 500)
    })
    this.manager.onError(() => {
      this.state = 'waiting'
      setTimeout(() => this.showChoices(), 500)
    })

    try {
      await this.manager.connect(this.npcId)
    } catch {
      this.showOfflineHint()
    }

    this.typewrite(greeting, () => {
      this.state = 'waiting'
      setTimeout(() => this.showChoices(), 500)
    })
  }

  private typewrite(text: string, onDone?: () => void) {
    this.state = 'speaking'
    this.displayedText = ''
    this.textEl.textContent = ''
    clearInterval(this.typewriterInterval)
    this.clearChoices()
    let i = 0
    const delay = text.length > 120 ? 25 : 35
    this.typewriterInterval = setInterval(() => {
      this.displayedText += text[i]
      this.textEl.textContent = this.displayedText
      i++
      if (i >= text.length) {
        clearInterval(this.typewriterInterval)
        onDone?.()
      }
    }, delay)

    const skip = () => {
      if (this.state !== 'speaking') return
      clearInterval(this.typewriterInterval)
      this.displayedText = text
      this.textEl.textContent = text
      onDone?.()
      window.removeEventListener('keydown', skip)
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ') skip()
    }, { once: true })
  }

  private showChoices() {
    if (this.state !== 'waiting') return
    this.clearChoices()
    const choices = (CHOICES[this.npcId] ?? DEFAULT_CHOICES).slice(0, 4)
    const colors = NPC_COLORS[this.npcId] ?? DEFAULT_COLOR

    choices.forEach((c, i) => {
      const btn = document.createElement('button')
      Object.assign(btn.style, {
        background: '#0e0e0c', border: '1px solid #1e1e1c',
        color: '#666660', fontFamily: 'monospace', fontSize: '9px',
        padding: '3px 7px', cursor: 'pointer',
      })
      btn.textContent = `${i + 1}. ${c.label}`
      btn.onmouseenter = () => { btn.style.color = colors.accent }
      btn.onmouseleave = () => { btn.style.color = '#666660' }
      btn.onclick = () => {
        this.pendingTrustDelta = c.trustDelta ?? 0
        this.send(c.text)
      }
      this.choicesEl.appendChild(btn)
    })

    this.showInput(choices, colors.accent)
    this.hintEl.textContent = '[Enter] send   [1-4] quick reply   [Esc] leave'
  }

  private showInput(
    choices: Array<{ label: string; text: string; trustDelta?: number }>,
    accentColor: string,
  ) {
    this.inputEl?.remove()
    const input = document.createElement('input')
    Object.assign(input.style, {
      position: 'absolute', bottom: '28px', left: '20px', right: '20px',
      width: 'calc(100% - 40px)',
      background: 'transparent', border: 'none',
      borderBottom: '1px solid #2a2a24',
      color: '#c8c4be', fontFamily: 'monospace', fontSize: '12px',
      outline: 'none', caretColor: '#888880', padding: '0',
    })
    this.panel.appendChild(input)
    this.inputEl = input
    setTimeout(() => input.focus(), 50)

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        const text = input.value.trim()
        if (text) {
          this.pendingTrustDelta = this.analyzeTrust(text)
          this.send(text)
        }
        return
      }
      if (e.key === 'Escape') { this.close(); return }
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && choices[num - 1]) {
        const c = choices[num - 1]
        this.pendingTrustDelta = c.trustDelta ?? 0
        this.send(c.text)
      }
    })
  }

  private send(text: string) {
    if (!text.trim()) return
    this.clearInput()
    this.clearChoices()

    // Detect follow phrases
    const lower = text.toLowerCase()
    const followPhrases = ['walk with', 'follow me', 'come with', 'come along', 'stay with me', 'walk together', 'come on']
    const stopPhrases = ['stop following', 'go back', 'leave me', 'stay here', 'wait here', "don't follow"]
    if (stopPhrases.some(p => lower.includes(p))) { this.pendingStopFollow = true; this.pendingFollowRequest = false }
    else if (followPhrases.some(p => lower.includes(p))) { this.pendingFollowRequest = true; this.pendingStopFollow = false }

    const nameMatch = text.match(/(?:my name is|i(?:'m| am)) ([A-Za-z]+)/i)
    if (nameMatch) {
      this.playerName = nameMatch[1]
      void this.worldState.setFlag('player_name', this.playerName)
      void this.worldState.logEvent(`Player revealed their name: ${this.playerName}`)
      this.pendingTrustDelta = Math.max(-3, Math.min(3, this.pendingTrustDelta + 1))
    }

    void this.worldState.logEvent(`Player said to ${this.npcId}: "${text}"`)

    if (!this.manager.isConnected()) {
      this.typewrite('...', () => {
        this.state = 'waiting'
        setTimeout(() => this.showChoices(), 500)
      })
      return
    }

    this.state = 'speaking'
    this.displayedText = ''
    this.pendingTokens = ''
    this.textEl.textContent = ''
    this.hintEl.textContent = '[Space] skip'

    // Streaming typewriter driven by tokens
    clearInterval(this.typewriterInterval)
    this.typewriterInterval = setInterval(() => {
      if (this.pendingTokens.length > 0) {
        const ch = this.pendingTokens[0]
        this.pendingTokens = this.pendingTokens.slice(1)
        this.displayedText += ch
        this.textEl.textContent = this.displayedText
      }
    }, 30)

    this.manager.sendPlayerInput(text, this.playerName, this.currentRelationship)
  }

  private analyzeTrust(text: string): number {
    const t = text.toLowerCase()
    if (/you'?re?\s+lying|stop\s+lying|i\s+don'?t\s+believe|you\s+know\s+more|tell\s+me\s+the\s+truth/.test(t)) return -1
    if (/\bplease\b|i\s+understand|help\s+me|i\s+trust\s+you|thank\s+you|not\s+here\s+to\s+hurt/.test(t)) return 1
    return 0
  }

  private updateRelIndicator() {
    const r = this.currentRelationship
    let phrase = ''
    if      (r <= -3) phrase = "won't look at you"
    else if (r === -2) phrase = 'watches the door'
    else if (r === -1) phrase = 'keeps something back'
    else if (r === 0)  phrase = ''
    else if (r === 1)  phrase = 'says more than they mean to'
    else if (r === 2)  phrase = 'decides to trust you'
    else               phrase = 'afraid for you now'

    this.relEl.textContent = phrase
    this.relEl.style.opacity = phrase ? '0.75' : '0'
  }

  private clearChoices() {
    while (this.choicesEl?.firstChild) this.choicesEl.removeChild(this.choicesEl.firstChild)
  }

  private clearInput() {
    this.inputEl?.remove()
    this.inputEl = null
  }

  private showOfflineHint() {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '9px', color: '#555548',
    })
    el.textContent = '[ai offline — start backend for live responses]'
    this.panel?.appendChild(el)
  }

  close() {
    window.removeEventListener('keydown', this.boundEsc)
    clearInterval(this.typewriterInterval)
    this.manager.disconnect()
    this.clearInput()
    this.panel?.remove()
    const followReq = this.pendingFollowRequest
    const stopFollow = this.pendingStopFollow
    const npcId = this.npcId
    this.pendingFollowRequest = false
    this.pendingStopFollow = false
    this.onCloseCallback?.(followReq, stopFollow, npcId)
    this.onCloseCallback = undefined
  }
}
