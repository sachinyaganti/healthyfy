import { useEffect, useRef } from 'react'

export default function FloatingMarqueeNote() {
  const pillRef = useRef(null)
const ariaText =
    'Note: Healthyfy provides wellness and lifestyle support only. It does NOT diagnose, treat, or replace professional medical advice.'

const text = (
    <>
        <span style={{ color: '#ff0000', fontWeight: 700 }}>NOTE: </span>Healthyfy provides wellness and lifestyle support only. It does{' '}
        <span style={{ color: '#ff0000', fontWeight: 700 }}>NOT</span> diagnose, treat, or replace
        professional medical advice.
    </>
)

  useEffect(() => {
    function updateReservedSpace() {
      const el = pillRef.current
      const h = el?.getBoundingClientRect?.().height
      if (typeof h === 'number' && h > 0) {
        // Reserve marquee height + top/bottom gaps (0.75rem + 0.75rem ≈ 24px)
        const reserved = Math.ceil(h + 24)
        document.documentElement.style.setProperty('--floating-marquee-space', `${reserved}px`)
      }
    }

    updateReservedSpace()

    const ro = window.ResizeObserver ? new ResizeObserver(updateReservedSpace) : null
    if (ro && pillRef.current) ro.observe(pillRef.current)

    window.addEventListener('resize', updateReservedSpace)
    return () => {
      window.removeEventListener('resize', updateReservedSpace)
      if (ro) ro.disconnect()
    }
  }, [])

  return (
    <div className="floatingMarquee" role="note" aria-label={text}>
      <div ref={pillRef} className="floatingMarqueePill">
        <div className="floatingMarqueeTrack" aria-hidden="true">
          <span className="floatingMarqueeItem">{text}</span>
          <span className="floatingMarqueeItem">{text}</span>
        </div>
      </div>
    </div>
  )
}
