import { GameController } from './engine/GameController'

// ── Intro overlay ─────────────────────────────────────────────────────────────

function showIntro(onDone: () => void) {
  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: '#000',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'monospace', color: '#cccccc',
    zIndex: '99999',
  })

  const sub = document.createElement('div')
  Object.assign(sub.style, {
    fontSize: '9px', color: '#555555', letterSpacing: '1px',
    marginBottom: '24px', textAlign: 'center',
  })
  sub.textContent = "A MESSAGE — found in your coat pocket.\nYou don't remember putting it there."
  sub.style.whiteSpace = 'pre'
  overlay.appendChild(sub)

  const sep = document.createElement('div')
  Object.assign(sep.style, { fontSize: '8px', color: '#333333', marginBottom: '28px' })
  sep.textContent = '— — —'
  overlay.appendChild(sep)

  const body = document.createElement('div')
  Object.assign(body.style, {
    fontSize: '11px', lineHeight: '1.9', textAlign: 'center',
    whiteSpace: 'pre', color: '#aaaaaa',
  })
  body.textContent = [
    'I found it.',
    "The town I was telling you about. Ashveil.",
    '',
    "It's real. It's on no map I can find, but it's real.",
    'Something happened here. Everyone left — or almost everyone.',
    "The ones who stayed... they're not right.",
    '',
    'Come find me.',
    '— D',
    '',
    "P.S. Don't tell anyone in town you're looking for me.",
    '     They already know.',
  ].join('\n')
  overlay.appendChild(body)

  const prompt = document.createElement('div')
  Object.assign(prompt.style, {
    marginTop: '36px', fontSize: '8px', color: '#444444',
    animation: 'blink 1.2s ease-in-out infinite',
  })
  prompt.textContent = '[press any key]'
  overlay.appendChild(prompt)

  // Inject blink keyframe
  if (!document.getElementById('blink-style')) {
    const style = document.createElement('style')
    style.id = 'blink-style'
    style.textContent = '@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }'
    document.head.appendChild(style)
  }

  document.body.appendChild(overlay)

  const dismiss = () => {
    overlay.style.transition = 'opacity 0.5s'
    overlay.style.opacity = '0'
    setTimeout(() => { overlay.remove(); onDone() }, 500)
    window.removeEventListener('keydown', dismiss)
    window.removeEventListener('click', dismiss)
  }
  window.addEventListener('keydown', dismiss, { once: true })
  window.addEventListener('click',   dismiss, { once: true })
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function startGame() {
  const container = document.getElementById('app') ?? document.body

  showIntro(() => {
    const controller = new GameController(container)

    let lastTime = performance.now()

    function loop(now: number) {
      const delta = Math.min(now - lastTime, 100)  // cap at 100ms to avoid spiral of death
      lastTime = now
      controller.update(delta)
      controller.render()
      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  })
}
