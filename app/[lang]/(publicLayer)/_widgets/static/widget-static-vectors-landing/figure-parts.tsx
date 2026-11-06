import type { CSSProperties, ReactNode } from "react"

// ФИГУРКА CLAUDE ИЗ БРУСКОВ (узел, шаг 662-7; образец владельца 2026-11-06 — коралловый корпус, две руки, четыре ноги, две прорези глаз на
// тёмной сетке). Здесь только геометрия: брусок из шести граней CSS 3D и места частей. Движение — `builder-figure.client.tsx`.
export type Vec = [number, number, number]
export type PartDef = {
  id: string
  size: Vec
  pos: Vec
  rotZ?: number
  dark?: boolean
  /** Где часть висит, пока к ней тянутся подписи (смещение от собранного места). */
  explode: Vec
  /** Откуда прилетает. */
  from: Vec
  spin: [number, number]
}

export const FEET_Y = 135
// 667 (владелец 2026-11-06: «он появляется слева направо это неправильно он должен появляться справа налево но оставаться в том же самом
// положении»): все части прилетают справа — `from` по x только положительный (корпус был −560, левая рука −620, левые ноги −180/−120);
// собранное место (`pos`) прежнее.
export const PARTS: PartDef[] = [
  { id: "body", size: [210, 130, 120], pos: [0, 0, 0], explode: [0, -6, 0], from: [560, -190, 0], spin: [50, 70] },
  { id: "eyeL", size: [26, 46, 8], pos: [-52, -14, 63], dark: true, explode: [-14, -46, 96], from: [260, -420, 0], spin: [-80, 40] },
  { id: "eyeR", size: [26, 46, 8], pos: [52, -14, 63], dark: true, explode: [14, -46, 96], from: [480, -320, 0], spin: [-60, 70] },
  { id: "armL", size: [62, 22, 26], pos: [-136, 14, 0], rotZ: 18, explode: [-54, -14, 0], from: [620, 60, 0], spin: [0, -120] },
  { id: "armR", size: [62, 22, 26], pos: [136, 14, 0], rotZ: -18, explode: [54, -14, 0], from: [640, 40, 0], spin: [0, -120] },
  { id: "legBL", size: [26, 70, 26], pos: [-26, 100, -38], explode: [-10, 52, -10], from: [180, 460, 0], spin: [90, 0] },
  { id: "legBR", size: [26, 70, 26], pos: [26, 100, -38], explode: [10, 52, -10], from: [220, 460, 0], spin: [90, 0] },
  { id: "legFL", size: [26, 70, 26], pos: [-72, 100, 38], explode: [-10, 52, 10], from: [120, 480, 0], spin: [100, 0] },
  { id: "legFR", size: [26, 70, 26], pos: [72, 100, 38], explode: [10, 52, 10], from: [140, 480, 0], spin: [100, 0] },
]

// ── 667: БУМАЖНЫЙ САМОЛЁТИК TELEGRAM ─────────────────────────────────────────────────────────────────────────────────────────────
// Владелец 2026-11-06: «Добавь ещё заключительный кадр … прилетает самолётик пролетает по синусоиде сзади клада и в конце падает у него
// перед ногами. Самолётик должен быть бумажный имитирующий Telegram поскольку попишем что код приходит вместе с [Telegram]». Путь — в
// координатах фигурки (от её центра): справа налево по синусоиде ЗА корпусом (z −175, сцена 3D сама прячет его за фигуркой), за левым
// краем — разворот (там его не видно), затем к ногам СПЕРЕДИ (z +115) со снижением и лёгким отскоком на полу.
const REST: [number, number, number, number] = [-8, FEET_Y - 14, 135, 8]
const ease = { out: (v: number) => 1 - (1 - v) ** 3, inOut: (v: number) => (1 - Math.cos(Math.PI * v)) / 2, in: (v: number) => v * v }
const deg = (dy: number, dx: number) => (Math.atan2(dy, dx) * 180) / Math.PI
const plane = (x: number, y: number, z: number, rot: number, flip: boolean) => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateZ(${rot.toFixed(1)}deg) scaleX(${flip ? -1 : 1})`
/** Самолётик в покое — у ног, носом вправо: последний кадр сервера и «меньше движения». */
export const PLANE_REST = plane(REST[0], REST[1], REST[2], REST[3], false)
/** Где он ждёт до своего кадра — за правым краем сцены и до, и после приближения камеры. */
export const PLANE_START = plane(560, -78, -175, 0, true)
/** Полёт кадрами: 0–0,6 — за корпусом справа налево (нос влево), 0,6–1 — из-за левого края к ногам (нос вправо). */
export function planeFrames(n = 56): Keyframe[] {
  const at = (t: number): [number, number, number] => {
    if (t <= 0.6) { const u = t / 0.6; return [560 - 860 * u, -78 + 30 * Math.sin(2 * Math.PI * 1.25 * u), -175] }
    const v = (t - 0.6) / 0.4
    return [-300 + (REST[0] + 300) * ease.out(v), -60 + (REST[1] + 60) * ease.in(v) - 22 * Math.sin(Math.PI * v) * (1 - v), -175 + (REST[2] + 175) * ease.inOut(v)]
  }
  const frames: Keyframe[] = []
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 0.94
    const [x, y, z] = at(t)
    const [x2, y2] = at(Math.min(1, t + 0.01))
    const back = t > 0.6
    const rot = back ? deg(y2 - y, x2 - x) : deg(y2 - y, x2 - x) - 180
    frames.push({ transform: plane(x, y, z, Math.max(-50, Math.min(50, ((rot + 540) % 360) - 180)), !back), offset: t })
  }
  // Касание пола и отскок — нос выравнивается.
  frames.push({ transform: plane(REST[0], REST[1] - 7, REST[2], 20, false), offset: 0.97 })
  frames.push({ transform: PLANE_REST, offset: 1 })
  return frames
}

/** Бумажный самолётик в цветах Telegram (форма знакомого «отправить»): две грани и сгиб, тонкая белая кромка; нос вправо. */
export function PaperPlane() {
  return (
    <svg data-block="fg007" width={56} height={56} viewBox="0 0 24 24" style={{ position: "absolute", left: -28, top: -28, overflow: "visible", transform: "rotate(45deg)" }} aria-hidden>
      <path d="M22 2 L2 9.2 L11 13 Z" fill="#63C7F5" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={0.35} strokeLinejoin="round" />
      <path d="M22 2 L11 13 L15 22 Z" fill="#229ED9" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={0.35} strokeLinejoin="round" />
      <path d="M11 13 L15 22 L12.6 14.2 Z" fill="#167BB0" />
    </svg>
  )
}

const CORAL = { front: "#d9694f", back: "#c25a43", side: "#b9533c", top: "#e98a70", bottom: "#8f3f2e" }
const DARK = { front: "#0b0f17", back: "#0b0f17", side: "#111827", top: "#1e293b", bottom: "#0b0f17" }
const HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 1.5px, transparent 1.5px 6px)"
const EDGE = "inset 0 0 0 1px rgba(226,232,240,.6)"
const P3: CSSProperties = { position: "absolute", transformStyle: "preserve-3d" }

function Face({ w, h, left = 0, top = 0, transform, color, children }: { w: number; h: number; left?: number; top?: number; transform: string; color: string; children?: ReactNode }) {
  return (
    <div data-block="fg001" style={{ position: "absolute", left, top, width: w, height: h, transform, background: `${HATCH}, ${color}`, boxShadow: EDGE, backfaceVisibility: "hidden" }}>
      {children}
    </div>
  )
}

/** Брусок w×h×d с центром в своей точке; `anchors` — точки на передней грани (от её центра), к которым тянутся подписи. */
export function Cuboid({ size: [w, h, d], dark, anchors }: { size: Vec; dark?: boolean; anchors?: { key: string; at: [number, number]; set: (key: string, el: HTMLDivElement | null) => void }[] }) {
  const c = dark ? DARK : CORAL
  return (
    <div data-block="fg002" style={{ ...P3, left: -w / 2, top: -h / 2, width: w, height: h }}>
      <Face w={w} h={h} transform={`translateZ(${d / 2}px)`} color={c.front}>
        {anchors?.map((a) => (
          <div data-block="fg003" key={a.key} ref={(el) => a.set(a.key, el)} style={{ position: "absolute", left: w / 2 + a.at[0] - 1, top: h / 2 + a.at[1] - 1, width: 2, height: 2 }} />
        ))}
      </Face>
      <Face w={w} h={h} transform={`rotateY(180deg) translateZ(${d / 2}px)`} color={c.back} />
      <Face w={d} h={h} left={(w - d) / 2} transform={`rotateY(90deg) translateZ(${w / 2}px)`} color={c.side} />
      <Face w={d} h={h} left={(w - d) / 2} transform={`rotateY(-90deg) translateZ(${w / 2}px)`} color={c.side} />
      <Face w={w} h={d} top={(h - d) / 2} transform={`rotateX(90deg) translateZ(${h / 2}px)`} color={c.top} />
      <Face w={w} h={d} top={(h - d) / 2} transform={`rotateX(-90deg) translateZ(${h / 2}px)`} color={c.bottom} />
    </div>
  )
}

/** Пол: сетка, гаснущая к краям, и штрихованная тень под ногами (её сжимает прыжок). */
export function Floor({ shadowRef }: { shadowRef: (el: HTMLDivElement | null) => void }) {
  const grid = "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px) 0 0 / 40px 40px"
  return (
    <div data-block="fg004" style={{ ...P3, left: -450, top: -450, width: 900, height: 900, transform: `translateY(${FEET_Y}px) rotateX(90deg)` }}>
      <div data-block="fg005" style={{ position: "absolute", inset: 0, background: grid, maskImage: "radial-gradient(circle at center, #000 25%, transparent 68%)", WebkitMaskImage: "radial-gradient(circle at center, #000 25%, transparent 68%)" }} />
      <div data-block="fg006" ref={shadowRef} style={{ position: "absolute", left: 300, top: 360, width: 300, height: 180, background: "repeating-linear-gradient(0deg, rgba(226,232,240,.32) 0 1px, transparent 1px 5px)", maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 70%)" }} />
    </div>
  )
}
