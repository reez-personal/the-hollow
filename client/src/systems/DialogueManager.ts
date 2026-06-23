type TokenCallback = (token: string) => void
type TurnEndCallback = (fullResponse: string) => void
type ConnectedCallback = () => void
type ErrorCallback = (msg: string) => void

export class DialogueManager {
  private ws: WebSocket | null = null
  private onTokenCb: TokenCallback | null = null
  private onTurnEndCb: TurnEndCallback | null = null
  private onConnectedCb: ConnectedCallback | null = null
  private onErrorCb: ErrorCallback | null = null

  connect(npcId: string, timeoutMs = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const host = window.location.host
      this.ws = new WebSocket(`ws://${host}/ws/npc/${npcId}`)
      let settled = false

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          this.ws?.close()
          this.ws = null
          reject(new Error('Connection timed out'))
        }
      }, timeoutMs)

      this.ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data as string) as {
          type: string
          text?: string
          full_response?: string
          message?: string
          npc_id?: string
        }

        if (msg.type === 'connected') {
          if (!settled) { settled = true; clearTimeout(timeout); resolve() }
          this.onConnectedCb?.()
        } else if (msg.type === 'token') {
          this.onTokenCb?.(msg.text ?? '')
        } else if (msg.type === 'turn_end') {
          this.onTurnEndCb?.(msg.full_response ?? '')
        } else if (msg.type === 'error') {
          this.onErrorCb?.(msg.message ?? 'Unknown error')
        }
      }

      this.ws.onerror = () => {
        if (!settled) { settled = true; clearTimeout(timeout); reject(new Error('WebSocket error')) }
      }
      this.ws.onclose = () => { this.ws = null }
    })
  }

  sendPlayerInput(text: string, playerName: string, relationship = 0) {
    if (!this.ws) return
    this.ws.send(JSON.stringify({ type: 'player_input', text, player_name: playerName, relationship }))
  }

  onToken(cb: TokenCallback) { this.onTokenCb = cb }
  onTurnEnd(cb: TurnEndCallback) { this.onTurnEndCb = cb }
  onConnected(cb: ConnectedCallback) { this.onConnectedCb = cb }
  onError(cb: ErrorCallback) { this.onErrorCb = cb }

  disconnect() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'disconnect' }))
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
