export class HUD {
  private questEl: HTMLDivElement
  private proximityEl: HTMLDivElement
  private proximityTimer?: ReturnType<typeof setTimeout>
  private proximityFadeTimer?: ReturnType<typeof setTimeout>

  constructor() {
    this.questEl = document.createElement('div')
    Object.assign(this.questEl.style, {
      position: 'fixed',
      top: '12px',
      left: '12px',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#6a6450',
      opacity: '0.75',
      pointerEvents: 'none',
      zIndex: '500',
      maxWidth: '320px',
      lineHeight: '1.5',
    })
    document.body.appendChild(this.questEl)

    this.proximityEl = document.createElement('div')
    Object.assign(this.proximityEl.style, {
      position: 'fixed',
      top: '40%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#7a7062',
      textAlign: 'center',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '500',
      maxWidth: '320px',
      lineHeight: '1.7',
      whiteSpace: 'pre-wrap',
      transition: 'opacity 0.9s ease-in-out',
    })
    document.body.appendChild(this.proximityEl)
  }

  setQuest(text: string) {
    this.questEl.textContent = text ? `— ${text}` : ''
  }

  showProximityText(text: string) {
    clearTimeout(this.proximityTimer)
    clearTimeout(this.proximityFadeTimer)

    this.proximityEl.style.transition = 'none'
    this.proximityEl.style.opacity = '0'
    this.proximityEl.textContent = text

    // Fade in
    requestAnimationFrame(() => {
      this.proximityEl.style.transition = 'opacity 0.9s ease-in-out'
      this.proximityEl.style.opacity = '0.72'
    })

    // Hold then fade out
    this.proximityTimer = setTimeout(() => {
      this.proximityEl.style.opacity = '0'
    }, 3700)
  }

  destroy() {
    this.questEl.remove()
    this.proximityEl.remove()
  }
}
