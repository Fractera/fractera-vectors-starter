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
export const PARTS: PartDef[] = [
  { id: "body", size: [210, 130, 120], pos: [0, 0, 0], explode: [0, -6, 0], from: [-560, -190, 0], spin: [50, -70] },
  { id: "eyeL", size: [26, 46, 8], pos: [-52, -14, 63], dark: true, explode: [-14, -46, 96], from: [260, -420, 0], spin: [-80, 40] },
  { id: "eyeR", size: [26, 46, 8], pos: [52, -14, 63], dark: true, explode: [14, -46, 96], from: [480, -320, 0], spin: [-60, 70] },
  { id: "armL", size: [62, 22, 26], pos: [-136, 14, 0], rotZ: 18, explode: [-54, -14, 0], from: [-620, 60, 0], spin: [0, 120] },
  { id: "armR", size: [62, 22, 26], pos: [136, 14, 0], rotZ: -18, explode: [54, -14, 0], from: [640, 40, 0], spin: [0, -120] },
  { id: "legBL", size: [26, 70, 26], pos: [-26, 100, -38], explode: [-10, 52, -10], from: [-180, 460, 0], spin: [90, 0] },
  { id: "legBR", size: [26, 70, 26], pos: [26, 100, -38], explode: [10, 52, -10], from: [220, 460, 0], spin: [90, 0] },
  { id: "legFL", size: [26, 70, 26], pos: [-72, 100, 38], explode: [-10, 52, 10], from: [-120, 480, 0], spin: [100, 0] },
  { id: "legFR", size: [26, 70, 26], pos: [72, 100, 38], explode: [10, 52, 10], from: [140, 480, 0], spin: [100, 0] },
]

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
