/**
 * Footer illustration (original): an engraving-style landscape of layered rolling hills drawn with
 * procedurally generated hatch strokes, a small figure on the nearest hill holding a long curved
 * string up to a diamond kite with cross spars and a bowed tail.
 *
 * Fully deterministic (seeded PRNG), generated paths only — no images. Server component.
 */
import { cn } from '@/lib/cn'

const W = 1440
const H = 300

/** mulberry32 — small, fast, deterministic PRNG. */
function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => (Math.round(n * 10) / 10).toString()

interface Layer {
  ridge: (x: number) => number
  /** hatch line spacing (px) — wider for nearer layers */
  spacing: number
  /** number of contour lines below the ridge */
  lines: number
  /** ridge highlight opacity */
  glow: number
}

function makeLayer(rand: () => number, base: number, amp: number, spacing: number, lines: number, glow: number): Layer {
  const waves = Array.from({ length: 4 }, (_, k) => ({
    a: (1 / (k + 1)) * (0.6 + rand() * 0.6),
    fr: ((k + 1) * (0.9 + rand() * 0.9) * Math.PI) / W,
    p: rand() * Math.PI * 2,
  }))
  const norm = waves.reduce((s, w) => s + w.a, 0)
  return {
    ridge: (x: number) => base - (amp * waves.reduce((s, w) => s + w.a * Math.sin(w.fr * x + w.p), 0)) / norm,
    spacing,
    lines,
    glow,
  }
}

interface Art {
  layers: { fill: string; hatch: [string, string, string]; shade: string; ridge: string; glow: number }[]
  sky: string
  stipple: string
  grass: string
  figure: { body: string; head: { cx: number; cy: number } }
  string: string
  kite: { body: string; spars: string; tail: string; bows: string; shade: string }
}

function generate(seed: number): Art {
  const rand = prng(seed)
  const layers: Layer[] = [
    makeLayer(rand, 168, 34, 5.2, 9, 0.5),
    makeLayer(rand, 190, 30, 5.8, 10, 0.6),
    makeLayer(rand, 214, 26, 6.6, 11, 0.7),
    makeLayer(rand, 238, 22, 7.6, 10, 0.85),
    makeLayer(rand, 262, 16, 9, 7, 1),
  ]
  // nearest hill: a gentle knoll where the figure stands
  const FX = 540
  const near = layers[4]
  const nearBase = near.ridge
  near.ridge = (x: number) => nearBase(x) - 20 * Math.exp(-(((x - FX) / 170) ** 2))

  const out: Art['layers'] = []
  for (const L of layers) {
    // fill polygon
    let fill = `M-10 ${H}`
    for (let x = -10; x <= W + 10; x += 8) fill += `L${f(x)} ${f(L.ridge(x))}`
    fill += `L${W + 10} ${H}Z`

    // contour hatch lines following the ridge, broken into dashes, in three brightness bands
    const bands: [string[], string[], string[]] = [[], [], []]
    for (let j = 1; j <= L.lines; j++) {
      const band = j <= L.lines * 0.3 ? 0 : j <= L.lines * 0.65 ? 1 : 2
      const off = j * L.spacing * (1 + j * 0.05)
      const wob = rand() * Math.PI * 2
      let x = -10 + rand() * 20
      while (x < W + 10) {
        const len = 18 + rand() * (band === 0 ? 120 : 70)
        const gap = 3 + rand() * (band === 2 ? 34 : 14)
        let seg = ''
        for (let s = 0; s <= len; s += 6) {
          const xx = Math.min(x + s, W + 10)
          const yy = L.ridge(xx) + off + Math.sin(xx * 0.011 + wob) * (0.6 + j * 0.12)
          seg += `${s === 0 ? 'M' : 'L'}${f(xx)} ${f(yy)}`
        }
        bands[band].push(seg)
        x += len + gap
      }
    }

    // diagonal shading strokes on the slopes that face away from the light (rising to the right)
    let shade = ''
    for (let x = 0; x < W; x += 3.2 + rand() * 2.4) {
      const slope = L.ridge(x + 4) - L.ridge(x - 4)
      if (slope > -1.4) continue
      const top = L.ridge(x) + 2 + rand() * 4
      const len = 8 + rand() * 14 + Math.min(20, -slope * 4)
      shade += `M${f(x)} ${f(top)}l${f(len * 0.42)} ${f(len)}`
    }

    // bright ridge line
    let ridge = ''
    for (let x = -10; x <= W + 10; x += 6) ridge += `${x === -10 ? 'M' : 'L'}${f(x)} ${f(L.ridge(x) + 0.4)}`

    out.push({
      fill,
      hatch: [bands[0].join(''), bands[1].join(''), bands[2].join('')],
      shade,
      ridge,
      glow: L.glow,
    })
  }

  // sky: faint horizontal cloud hatching
  let sky = ''
  for (let c = 0; c < 5; c++) {
    const cx = 80 + rand() * (W - 160)
    const cy = 30 + rand() * 80
    const rows = 3 + Math.floor(rand() * 4)
    for (let r = 0; r < rows; r++) {
      const w = (120 + rand() * 160) * (1 - r / (rows + 1))
      const x0 = cx - w / 2 + (rand() - 0.5) * 30
      sky += `M${f(x0)} ${f(cy + r * 4.2)}h${f(w)}`
    }
  }

  // stipple dots on the near hills
  let stipple = ''
  for (let i = 0; i < 520; i++) {
    const L = layers[3 + Math.floor(rand() * 2)]
    const x = rand() * W
    const y = L.ridge(x) + 4 + rand() ** 1.7 * (H - L.ridge(x))
    stipple += `M${f(x)} ${f(y)}h0.01`
  }

  // grass tufts along the nearest ridge and the bottom edge
  let grass = ''
  for (let x = 4; x < W; x += 9 + rand() * 22) {
    const onRidge = rand() < 0.45
    const baseY = onRidge ? near.ridge(x) + 3 : H - 4 - rand() * 18
    if (Math.abs(x - FX) < 26 && onRidge) continue
    const blades = 3 + Math.floor(rand() * 5)
    const h = onRidge ? 5 + rand() * 7 : 12 + rand() * 24
    for (let b = 0; b < blades; b++) {
      const lean = (rand() - 0.5) * h * 0.9
      const bx = x + (rand() - 0.5) * 8
      grass += `M${f(bx)} ${f(baseY)}q${f(lean * 0.2)} ${f(-h * 0.6)} ${f(lean)} ${f(-h * (0.75 + rand() * 0.35))}`
    }
  }

  // figure on the knoll
  const gy = near.ridge(FX) + 0.5
  const fx = FX
  const body =
    // legs
    `M${f(fx - 2.6)} ${f(gy)}L${f(fx - 0.6)} ${f(gy - 9)}L${f(fx + 2.2)} ${f(gy)}` +
    // torso
    `M${f(fx - 0.6)} ${f(gy - 9)}L${f(fx)} ${f(gy - 17.5)}` +
    // left arm down
    `M${f(fx)} ${f(gy - 16)}L${f(fx - 3.6)} ${f(gy - 10.5)}` +
    // right arm raised toward the kite
    `M${f(fx)} ${f(gy - 16)}L${f(fx + 4.4)} ${f(gy - 20.5)}L${f(fx + 6.4)} ${f(gy - 24.5)}`
  const head = { cx: fx - 0.2, cy: gy - 20.6 }
  const hand = { x: fx + 6.4, y: gy - 24.5 }

  // kite high to the upper right
  const k = { x: 1010, y: 54 }
  const rot = (-16 * Math.PI) / 180
  const pt = (dx: number, dy: number) => ({
    x: k.x + dx * Math.cos(rot) - dy * Math.sin(rot),
    y: k.y + dx * Math.sin(rot) + dy * Math.cos(rot),
  })
  const top = pt(0, -26)
  const right = pt(17, -6)
  const bottom = pt(0, 30)
  const left = pt(-17, -6)
  const cross = pt(0, -6)
  const kbody = `M${f(top.x)} ${f(top.y)}L${f(right.x)} ${f(right.y)}L${f(bottom.x)} ${f(bottom.y)}L${f(left.x)} ${f(left.y)}Z`
  const spars = `M${f(top.x)} ${f(top.y)}L${f(bottom.x)} ${f(bottom.y)}M${f(left.x)} ${f(left.y)}Q${f(cross.x)} ${f(cross.y - 5)} ${f(right.x)} ${f(right.y)}`
  // hatch one half of the kite for an engraved look
  let kshade = ''
  for (let t = 0.12; t < 1; t += 0.11) {
    const a = { x: top.x + (right.x - top.x) * t, y: top.y + (right.y - top.y) * t }
    const b = { x: top.x + (bottom.x - top.x) * t, y: top.y + (bottom.y - top.y) * t }
    kshade += `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`
  }
  for (let t = 0.15; t < 1; t += 0.13) {
    const a = { x: right.x + (bottom.x - right.x) * t, y: right.y + (bottom.y - right.y) * t }
    const b = { x: top.x + (bottom.x - top.x) * (0.3 + t * 0.7), y: top.y + (bottom.y - top.y) * (0.3 + t * 0.7) }
    kshade += `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`
  }
  // bowed tail drifting down-left in a lazy S
  const tail: { x: number; y: number }[] = []
  for (let i = 0; i <= 28; i++) {
    const t = i / 28
    tail.push({ x: bottom.x - t * 70 + Math.sin(t * Math.PI * 2.2) * 12, y: bottom.y + t * 74 + Math.sin(t * Math.PI) * 6 })
  }
  const tailPath = tail.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('')
  let bows = ''
  for (const i of [5, 11, 17, 23]) {
    const p = tail[i]
    bows += `M${f(p.x - 4.5)} ${f(p.y - 2.6)}L${f(p.x + 4.5)} ${f(p.y + 2.6)}L${f(p.x + 4.5)} ${f(p.y - 2.6)}L${f(p.x - 4.5)} ${f(p.y + 2.6)}Z`
  }
  // long string with a soft sag: hand → kite bridle
  const bridle = pt(0, 2)
  const c1 = { x: hand.x + (bridle.x - hand.x) * 0.38, y: hand.y - 30 }
  const c2 = { x: hand.x + (bridle.x - hand.x) * 0.78, y: bridle.y + 70 }
  const stringPath = `M${f(hand.x)} ${f(hand.y)}C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(bridle.x)} ${f(bridle.y)}`

  return {
    layers: out,
    sky,
    stipple,
    grass,
    figure: { body, head },
    string: stringPath,
    kite: { body: kbody, spars, tail: tailPath, bows, shade: kshade },
  }
}

// Generated once per server process / module load; identical output on every render.
const ART = generate(20261026)

export function FooterArt({ className, idPrefix = 'fa' }: { className?: string; idPrefix?: string }) {
  const ink = 'rgb(var(--inset))'
  const line = 'rgb(241 243 242)'
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn('block h-[clamp(220px,22vw,320px)] w-full', className)}
      role="img"
      aria-label="Engraving of a small figure on rolling hills flying a kite on a long string"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {ART.layers.map((l, i) => (
          <clipPath key={i} id={`${idPrefix}-hill-${i}`}>
            <path d={l.fill} />
          </clipPath>
        ))}
        <linearGradient id={`${idPrefix}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(241 243 242)" stopOpacity="0" />
          <stop offset="1" stopColor="rgb(241 243 242)" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      <path d={ART.sky} stroke={line} strokeOpacity="0.12" strokeWidth="0.8" />

      {/* kite + string sit behind the hills' ridges only where they overlap (they don't) */}
      <path d={ART.string} stroke={line} strokeOpacity="0.7" strokeWidth="0.75" />
      <path d={ART.kite.tail} stroke={line} strokeOpacity="0.75" strokeWidth="0.9" />
      <path d={ART.kite.bows} fill={line} fillOpacity="0.75" stroke={line} strokeOpacity="0.75" strokeWidth="0.6" />
      <path d={ART.kite.body} style={{ fill: ink }} stroke={line} strokeWidth="1.3" />
      <path d={ART.kite.shade} stroke={line} strokeOpacity="0.55" strokeWidth="0.7" />
      <path d={ART.kite.spars} stroke={line} strokeOpacity="0.95" strokeWidth="1" />

      {ART.layers.map((l, i) => (
        <g key={i}>
          <path d={l.fill} style={{ fill: ink }} />
          <rect x="0" y="0" width={W} height={H} fill={`url(#${idPrefix}-fade)`} clipPath={`url(#${idPrefix}-hill-${i})`} />
          <g clipPath={`url(#${idPrefix}-hill-${i})`} stroke={line}>
            <path d={l.hatch[0]} strokeOpacity={0.62 * l.glow} strokeWidth="0.85" />
            <path d={l.hatch[1]} strokeOpacity={0.36 * l.glow} strokeWidth="0.75" />
            <path d={l.hatch[2]} strokeOpacity={0.18 * l.glow} strokeWidth="0.7" />
            <path d={l.shade} strokeOpacity={0.3 * l.glow} strokeWidth="0.6" />
          </g>
          <path d={l.ridge} stroke={line} strokeOpacity={0.9 * l.glow} strokeWidth={0.8 + i * 0.15} />
        </g>
      ))}

      <path d={ART.stipple} stroke={line} strokeOpacity="0.32" strokeWidth="1.1" />
      <path d={ART.grass} stroke={line} strokeOpacity="0.6" strokeWidth="0.8" />

      <path d={ART.figure.body} stroke={line} strokeWidth="1.7" />
      <circle cx={ART.figure.head.cx} cy={ART.figure.head.cy} r="2.3" fill={line} />
    </svg>
  )
}
