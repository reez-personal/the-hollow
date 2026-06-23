export class ExamineUI {
  private div: HTMLDivElement | null = null
  private pages: string[] = []
  private page = 0
  private onCloseCallback?: () => void

  private boundKeydown = (e: KeyboardEvent) => this.handleKey(e)

  open(pages: string[], onClose?: () => void) {
    this.close()
    this.pages = pages
    this.page = 0
    this.onCloseCallback = onClose
    this.render()
    window.addEventListener('keydown', this.boundKeydown)
  }

  isOpen() { return this.div !== null }

  private handleKey(e: KeyboardEvent) {
    if (!this.div) return
    if (e.key === 'Escape') { e.preventDefault(); this.close(); return }
    if (e.key.toLowerCase() === 'e') {
      e.preventDefault()
      this.page++
      if (this.page >= this.pages.length) this.close()
      else this.render()
    }
  }

  private render() {
    this.div?.remove()
    const isLast = this.page >= this.pages.length - 1
    const total = this.pages.length

    const div = document.createElement('div')
    Object.assign(div.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      width: '100%',
      maxHeight: '45vh',
      overflowY: 'auto',
      background: 'rgba(4,4,4,0.97)',
      borderTop: '1px solid #222220',
      padding: '18px 28px 16px',
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.75',
      color: '#dedad4',
      whiteSpace: 'pre-wrap',
      zIndex: '9999',
    })

    const text = document.createElement('div')
    text.textContent = this.pages[this.page]
    div.appendChild(text)

    const hint = document.createElement('div')
    Object.assign(hint.style, { marginTop: '14px', color: '#666660', fontSize: '11px' })
    hint.textContent = `[E] ${isLast ? 'close' : 'next'}   [Esc] close   (${this.page + 1}/${total})`
    div.appendChild(hint)

    document.body.appendChild(div)
    this.div = div
  }

  close() {
    window.removeEventListener('keydown', this.boundKeydown)
    this.div?.remove()
    this.div = null
    this.onCloseCallback?.()
    this.onCloseCallback = undefined
  }
}
