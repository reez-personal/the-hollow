export class WorldState {
  private flags: Map<string, string> = new Map()
  private static instance: WorldState

  static getInstance(): WorldState {
    if (!WorldState.instance) WorldState.instance = new WorldState()
    return WorldState.instance
  }

  async setFlag(key: string, value: string): Promise<void> {
    this.flags.set(key, value)
    try {
      await fetch('/world/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } catch {
      // Server may not be running yet; keep local copy
    }
  }

  getFlag(key: string): string | null {
    return this.flags.get(key) ?? null
  }

  hasFlag(key: string): boolean {
    return this.flags.has(key)
  }

  async logEvent(text: string): Promise<void> {
    try {
      await fetch('/world/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    } catch {
      // Swallow if offline
    }
  }

  getQuestClueCount(): number {
    const clues = ['clue_daniel_notes', 'clue_diner_receipt', 'clue_church_page', 'clue_jacket']
    return clues.filter(c => this.hasFlag(c)).length
  }

  /** 0–7 quest stage, computed from flags. Higher = further in the story. */
  getQuestStage(): number {
    if (this.hasFlag('wallet_found'))   return 7  // You know. The well is waiting.
    if (this.hasFlag('recorder_found')) return 6  // Heard the tape. Go to Room 1.
    const vp = parseInt(this.getFlag('voice_phase') ?? '0', 10)
    if (vp >= 4)                        return 5  // All fragments heard. Find the recorder.
    if (vp >= 1)                        return 4  // Voice started. Follow it south.
    if (this.hasFlag('matchbook_found')) return 3  // Have matchbook. Find the payphone.
    if (this.getQuestClueCount() >= 1)  return 2  // Found clues. Keep investigating.
    if (this.hasFlag('talked_to_lead')) return 1  // Spoke to someone. Check Room 3.
    return 0
  }

  /** Returns current trust score with an NPC (-3 to +3, starts at 0). */
  getRelationship(npcId: string): number {
    return parseInt(this.getFlag(`rel_${npcId}`) ?? '0', 10)
  }

  /**
   * Adjusts the relationship score by delta, clamped to [-3, 3].
   * Persists as flag `rel_{npcId}`.
   */
  async adjustRelationship(npcId: string, delta: number): Promise<void> {
    const current = this.getRelationship(npcId)
    const next = Math.max(-3, Math.min(3, current + delta))
    await this.setFlag(`rel_${npcId}`, String(next))
  }

  /** Short objective line shown on the HUD. */
  getQuestObjective(): string {
    switch (this.getQuestStage()) {
      case 0: return 'Find someone who knew Daniel Farrow.'
      case 1: return 'Daniel Farrow stayed in Room 3. Investigate.'
      case 2: return "Follow Daniel's trail. There are more clues in this town."
      case 3: return 'There is a number on the matchbook. Find the payphone.'
      case 4: return 'Something is calling from south of town. Follow it.'
      case 5: return 'The voice stopped. Find what it left behind.'
      case 6: return 'Room 1. Your room. The drawer.'
      case 7: return 'You know what you are. The well is waiting.'
      default: return ''
    }
  }

  async sync(): Promise<void> {
    try {
      const res = await fetch('/world/flags')
      if (res.ok) {
        const data = await res.json() as Record<string, string>
        for (const [k, v] of Object.entries(data)) {
          this.flags.set(k, v)
        }
      }
    } catch {
      // Server offline
    }
  }
}
