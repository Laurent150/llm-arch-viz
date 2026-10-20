import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

type Pt = { x: number; y: number }

type VertRoute = {
  id: string
  d: string
  labelX: number
  labelY: number
  side: 'left' | 'right'
  title: string
  sub: string
}

type HorizRoute = {
  id: string
  d: string
  /** Mid-stroke chevron tip (points LEFT = backprop) */
  arrowX: number
  arrowY: number
  labelX: number
  labelY: number
  label: string
}

function centerOf(el: Element, root: DOMRect): Pt {
  const r = el.getBoundingClientRect()
  return {
    x: r.left + r.width / 2 - root.left,
    y: r.top + r.height / 2 - root.top,
  }
}

function sideMid(el: Element, root: DOMRect, side: 'left' | 'right'): Pt {
  const r = el.getBoundingClientRect()
  return {
    x: (side === 'left' ? r.left : r.right) - root.left,
    y: r.top + r.height / 2 - root.top,
  }
}

/** Vertical port bridge: down → jog → down. Open ends (no end arrowheads). */
function verticalElbow(from: Pt, to: Pt): { d: string; mid: Pt } {
  const dy = to.y - from.y
  const midY = from.y + Math.max(dy * 0.42, 28)
  const dx = to.x - from.x

  if (Math.abs(dx) < 1.5) {
    const jog = 16
    const d = [
      `M ${from.x.toFixed(1)} ${from.y.toFixed(1)}`,
      `L ${from.x.toFixed(1)} ${midY.toFixed(1)}`,
      `L ${(from.x + jog).toFixed(1)} ${midY.toFixed(1)}`,
      `L ${(from.x + jog).toFixed(1)} ${(midY + 10).toFixed(1)}`,
      `L ${to.x.toFixed(1)} ${(midY + 10).toFixed(1)}`,
      `L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
    ].join(' ')
    return { d, mid: { x: from.x + jog + 10, y: midY } }
  }

  const d = [
    `M ${from.x.toFixed(1)} ${from.y.toFixed(1)}`,
    `L ${from.x.toFixed(1)} ${midY.toFixed(1)}`,
    `L ${to.x.toFixed(1)} ${midY.toFixed(1)}`,
    `L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
  ].join(' ')
  return { d, mid: { x: (from.x + to.x) / 2, y: midY } }
}

/**
 * Horizontal backprop stroke: ALWAYS drawn right → left
 * (from left-edge of right card → right-edge of left card).
 * No end markers on card borders — mid chevron points LEFT.
 */
function horizontalBackprop(fromRightCardLeft: Pt, toLeftCardRight: Pt): {
  d: string
  mid: Pt
} {
  const midX = (fromRightCardLeft.x + toLeftCardRight.x) / 2
  const midY = (fromRightCardLeft.y + toLeftCardRight.y) / 2
  const dy = toLeftCardRight.y - fromRightCardLeft.y

  if (Math.abs(dy) < 1.5) {
    return {
      d: `M ${fromRightCardLeft.x.toFixed(1)} ${fromRightCardLeft.y.toFixed(1)} L ${toLeftCardRight.x.toFixed(1)} ${toLeftCardRight.y.toFixed(1)}`,
      mid: { x: midX, y: midY },
    }
  }
  return {
    d: [
      `M ${fromRightCardLeft.x.toFixed(1)} ${fromRightCardLeft.y.toFixed(1)}`,
      `L ${midX.toFixed(1)} ${fromRightCardLeft.y.toFixed(1)}`,
      `L ${midX.toFixed(1)} ${toLeftCardRight.y.toFixed(1)}`,
      `L ${toLeftCardRight.x.toFixed(1)} ${toLeftCardRight.y.toFixed(1)}`,
    ].join(' '),
    mid: { x: midX, y: midY },
  }
}

/** Chevron pointing LEFT (backprop), centered on (x,y). */
function leftChevron(x: number, y: number, size = 7): string {
  const t = size
  // tip on the left
  return `M ${(x + t).toFixed(1)} ${(y - t).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + t).toFixed(1)} ${(y + t).toFixed(1)}`
}

const VERT_SPECS = [
  {
    id: 'embed-opt',
    from: 'embed-out',
    to: 'opt-in',
    side: 'left' as const,
    title: '梯度回到参数',
    sub: 'θ ← Opt',
  },
  {
    id: 'block-autograd',
    from: 'block-out',
    to: 'autograd-in',
    side: 'right' as const,
    title: '∇θ · Autograd',
    sub: '穿过 Block×N',
  },
  {
    id: 'lm-loss',
    from: 'lm-out',
    to: 'loss-in',
    side: 'right' as const,
    title: 'logits → Loss',
    sub: '训练接 logits',
  },
]

/** Only two horizontals — no third stub into Opt from the left. */
const HORIZ_SPECS = [
  {
    id: 'loss-autograd',
    fromCard: 'loss-card',
    toCard: 'autograd-card',
    label: '∂L',
  },
  {
    id: 'autograd-opt',
    fromCard: 'autograd-card',
    toCard: 'opt-card',
    label: '∇θ',
  },
]

interface Props {
  stackRef: RefObject<HTMLElement | null>
  enabled: boolean
}

export function TrainBridgeOverlay({ stackRef, enabled }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [verts, setVerts] = useState<VertRoute[]>([])
  const [horiz, setHoriz] = useState<HorizRoute[]>([])

  const measure = useCallback(() => {
    const stack = stackRef.current
    if (!stack || !enabled) {
      setVerts([])
      setHoriz([])
      return
    }
    const root = stack.getBoundingClientRect()
    setSize({ w: Math.ceil(root.width), h: Math.ceil(root.height) })

    const q = (id: string) => stack.querySelector(`[data-train-port="${id}"]`)

    const nextVerts: VertRoute[] = []
    for (const spec of VERT_SPECS) {
      const a = q(spec.from)
      const b = q(spec.to)
      if (!a || !b) continue
      const from = centerOf(a, root)
      const to = centerOf(b, root)
      if (to.y - from.y < 12) continue
      const { d, mid } = verticalElbow(from, to)
      nextVerts.push({
        id: spec.id,
        d,
        labelX: spec.side === 'left' ? mid.x - 8 : mid.x + 8,
        labelY: mid.y,
        side: spec.side,
        title: spec.title,
        sub: spec.sub,
      })
    }
    setVerts(nextVerts)

    const nextHoriz: HorizRoute[] = []
    for (const spec of HORIZ_SPECS) {
      const rightCard = q(spec.fromCard)
      const leftCard = q(spec.toCard)
      if (!rightCard || !leftCard) continue
      // Right card's left edge → left card's right edge (flow RIGHT→LEFT)
      const from = sideMid(rightCard, root, 'left')
      const to = sideMid(leftCard, root, 'right')
      if (from.x - to.x < 4) continue
      const { d, mid } = horizontalBackprop(from, to)
      nextHoriz.push({
        id: spec.id,
        d,
        arrowX: mid.x,
        arrowY: mid.y,
        labelX: mid.x,
        labelY: mid.y - 14,
        label: spec.label,
      })
    }
    setHoriz(nextHoriz)
  }, [stackRef, enabled])

  useLayoutEffect(() => {
    if (!enabled) {
      setVerts([])
      setHoriz([])
      return
    }
    measure()
    const stack = stackRef.current
    if (!stack) return

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(stack)
    const lane = stack.querySelector('.backprop-lane')
    if (lane) ro.observe(lane)

    const t1 = window.setTimeout(measure, 50)
    const t2 = window.setTimeout(measure, 200)
    const t3 = window.setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.removeEventListener('resize', measure)
    }
  }, [enabled, measure, stackRef])

  if (!enabled || size.w < 1 || size.h < 1) return null

  return (
    <div className="train-bridge-overlay" aria-hidden>
      <svg
        className="train-bridge-svg"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
      >
        {/* Verticals: port-to-port alignment bridges — open ends, no directional arrowheads */}
        {verts.map((v) => (
          <path
            key={v.id}
            className="train-bridge-path train-bridge-path--vert"
            d={v.d}
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Horizontals: backprop RIGHT→LEFT — stroke + mid chevron pointing LEFT */}
        {horiz.map((h) => (
          <g key={h.id} className="train-bridge-horiz-group">
            <path
              className="train-bridge-path train-bridge-path--horiz"
              d={h.d}
              fill="none"
              stroke="#fb923c"
              strokeWidth="2.25"
              strokeDasharray="6 5"
              strokeLinecap="butt"
              strokeLinejoin="round"
            />
            {/* Mid-line chevron: tip points LEFT (toward Opt) */}
            <path
              className="train-bridge-chevron"
              d={leftChevron(h.arrowX, h.arrowY, 8)}
              fill="none"
              stroke="#fb923c"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </svg>

      {verts.map((v) => (
        <div
          key={`lbl-${v.id}`}
          className={`train-bridge-label train-bridge-label--${v.side}`}
          style={{ left: v.labelX, top: v.labelY }}
        >
          <span className="train-bridge-label__title">{v.title}</span>
          <span className="train-bridge-label__sub muted">{v.sub}</span>
        </div>
      ))}

      {horiz.map((h) => (
        <div
          key={`hlbl-${h.id}`}
          className="train-bridge-label train-bridge-label--horiz"
          style={{ left: h.labelX, top: h.labelY }}
        >
          <span className="train-bridge-label__title">{h.label}</span>
        </div>
      ))}
    </div>
  )
}
