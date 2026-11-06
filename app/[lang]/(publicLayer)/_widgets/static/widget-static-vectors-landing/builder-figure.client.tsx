"use client"

import { useEffect, useRef, useState } from "react"
import { Cuboid, FEET_Y, Floor, PaperPlane, PARTS, PLANE_REST, PLANE_START, planeFrames, type Vec } from "./figure-parts"

// ФИГУРКА CLAUDE — «СВОЙ СТРОИТЕЛЬ» (узел, шаг 662-7). Владелец 2026-11-06: «сначала прилетает элементы потом к каждому элементу руки ноги
// головами отрисовываются линии и анимирована на них появляется текст затем все эти элементы соединяются в едино фигурка становится
// целостной затем эта фигурка разворачивается лицом к камере приседает подпрыгивает продолжительность около 1 секунды»; «должна
// прокручиваться в тот момент когда попадает в фокус». Сцена — бруски CSS 3D, движение — Web Animations по фазам; на сервере и при
// «меньше движения» — последний кадр (фигурка лицом к камере). Уходит из вида — сбрасывается, вернулась — играет снова.
const W = 680
const H = 440
const ORIGIN = { x: 236, y: 196 }
// 667 (владелец 2026-11-06): «сейчас он смотрит налево должен смотреть направо»; «поворачиваться он должен по часовой стрелке» — один знак:
// с +34° фигурка смотрит вправо, и разворот к камере идёт по часовой стрелке (если смотреть сверху).
const START = "rotateX(-14deg) rotateY(34deg)"
const END = "rotateX(-7deg) rotateY(0deg)"
const LABEL_X = 424
const LABEL_Y = [58, 130, 202, 274, 346]
// 667 (владелец: «сноски ноги и рот пересекаются … сноска рот должно быть выше а сноска [ноги] должна быть ниже»): РОТ — четвёртой строкой,
// НОГИ — последней. Последний кадр (владелец: «после того как он подпрыгивает нужно сделать увеличение и выравнивания его по центру окна»):
// «камера» везёт фигурку в центр окна и увеличивает в полтора раза; перспектива едет вместе с ней, объём не искажается.
const FOCUS = { x: ORIGIN.x, y: ORIGIN.y + 35 }
const ZOOM = `translate(${W / 2 - FOCUS.x}px, ${H / 2 - FOCUS.y}px) scale(1.5)`
const IDENT = "translate(0px, 0px) scale(1)"
type Word = { k: string; name: string; note: string; target: string; at: [number, number] }
const WORDS: Record<"ru" | "en", Word[]> = {
  ru: [
    { k: "A", name: "КОРПУС", note: "×1 · агент Claude Code", target: "body", at: [0, -42] },
    { k: "D", name: "ГЛАЗА", note: "×2 · видят только свою папку", target: "eyeR", at: [0, 0] },
    { k: "C", name: "РУКИ", note: "×2 · пишут код, отдают коммит", target: "armR", at: [0, 0] },
    { k: "E", name: "РОТ", note: "×0 · не болтает — бережёт токены", target: "body", at: [0, 38] },
    { k: "B", name: "НОГИ", note: "×4 · приходят в Telegram", target: "legFR", at: [0, 0] },
  ],
  en: [
    { k: "A", name: "BODY", note: "×1 · the Claude Code agent", target: "body", at: [0, -42] },
    { k: "D", name: "EYES", note: "×2 · see their own folder only", target: "eyeR", at: [0, 0] },
    { k: "C", name: "ARMS", note: "×2 · write code, hand back a commit", target: "armR", at: [0, 0] },
    { k: "E", name: "MOUTH", note: "×0 · no chatter — tokens saved", target: "body", at: [0, 38] },
    { k: "B", name: "LEGS", note: "×4 · walk into Telegram", target: "legFR", at: [0, 0] },
  ],
}
const t3 = (v: Vec) => `translate3d(${v[0]}px,${v[1]}px,${v[2]}px)`
const start = (i: number) => `${t3(PARTS[i].from)} rotateX(${PARTS[i].spin[0]}deg) rotateY(${PARTS[i].spin[1]}deg) scale(.55)`
const apart = (i: number) => `${t3(PARTS[i].explode)} rotateX(0deg) rotateY(0deg) scale(1)`
const home = `translate3d(0px,0px,0px) rotateX(0deg) rotateY(0deg) scale(1)`

export function BuilderFigure({ ru, title }: { ru: boolean; title: string }) {
  const words = WORDS[ru ? "ru" : "en"]
  const [k, setK] = useState(1)
  const outer = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  const bounce = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement | null>(null)
  const cam = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLDivElement>(null)
  const parts = useRef<(HTMLDivElement | null)[]>([])
  const anchors = useRef<Record<string, HTMLDivElement | null>>({})
  const lines = useRef<(SVGPolylineElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const names = useRef<(HTMLDivElement | null)[]>([])
  const notes = useRef<(HTMLDivElement | null)[]>([])
  const setAnchor = (key: string, el: HTMLDivElement | null) => { anchors.current[key] = el }

  useEffect(() => {
    const el = outer.current
    if (!el) return
    const ro = new ResizeObserver(() => setK(el.clientWidth / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = outer.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let run = 0
    let state: "pre" | "playing" | "done" = "done"
    let live: Animation[] = []
    const stop = () => { live.forEach((a) => a.cancel()); live = [] }
    const go = (node: Element | null | undefined, kf: Keyframe[], opt: KeyframeAnimationOptions) => {
      if (!node) return Promise.resolve()
      const a = node.animate(kf, { fill: "both", ...opt })
      live.push(a)
      return a.finished.catch(() => undefined)
    }
    const hide = (nodes: (Element | null)[]) => nodes.forEach((n) => go(n, [{ opacity: 0 }], { duration: 0 }))
    const pre = () => {
      run++
      stop()
      state = "pre"
      parts.current.forEach((p, i) => go(p, [{ transform: start(i) }], { duration: 0 }))
      go(group.current, [{ transform: START }], { duration: 0 })
      go(cam.current, [{ transform: IDENT }], { duration: 0 })
      go(plane.current, [{ transform: PLANE_START }], { duration: 0 })
      hide([...lines.current, ...dots.current, ...names.current, ...notes.current])
    }
    const play = async () => {
      const id = ++run
      state = "playing"
      const alive = () => id === run
      // 1. Прилёт: части летят из-за краёв сцены и вращаются. ✗ Без прозрачности: Chrome сплющивает объём у элемента, чья прозрачность
      // анимирована (даже удержанная на 1) — замерено: передняя и задняя грани ложились друг на друга. Прячет их обрезка сцены.
      await Promise.all(parts.current.map((p, i) => go(p, [{ transform: start(i) }, { transform: apart(i) }], { duration: 950, delay: i * 70, easing: "cubic-bezier(.16,1,.3,1)" })))
      if (!alive()) return
      // 2. Линии к частям и подписи — меряются по месту частей в эту минуту.
      const s = stage.current!.getBoundingClientRect()
      const scale = s.width / W
      const lens = words.map((w, i) => {
        const a = anchors.current[`${w.target}:${w.k}`]?.getBoundingClientRect()
        const x = a ? (a.left + a.width / 2 - s.left) / scale : 200
        const y = a ? (a.top + a.height / 2 - s.top) / scale : 200
        const pts: [number, number][] = [[x, y], [LABEL_X - 26, LABEL_Y[i] + 6], [LABEL_X - 6, LABEL_Y[i] + 6]]
        lines.current[i]?.setAttribute("points", pts.map((p) => p.join(",")).join(" "))
        dots.current[i]?.setAttribute("cx", String(x))
        dots.current[i]?.setAttribute("cy", String(y))
        return Math.hypot(pts[1][0] - x, pts[1][1] - y) + 20
      })
      await Promise.all(words.map((w, i) => Promise.all([
        go(dots.current[i], [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }], { duration: 260, delay: i * 120, easing: "cubic-bezier(.34,1.56,.64,1)" }),
        go(lines.current[i], [{ opacity: 1, strokeDasharray: `${lens[i]}`, strokeDashoffset: `${lens[i]}` }, { opacity: 1, strokeDasharray: `${lens[i]}`, strokeDashoffset: "0" }], { duration: 460, delay: i * 120 + 120, easing: "cubic-bezier(.22,1,.36,1)" }),
        go(names.current[i], [{ opacity: 1, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)" }], { duration: 320, delay: i * 120 + 480, easing: `steps(${w.name.length + 3})` }),
        go(notes.current[i], [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 0.78, transform: "translateY(0)" }], { duration: 320, delay: i * 120 + 700, easing: "ease-out" }),
      ])))
      if (!alive()) return
      await new Promise((r) => setTimeout(r, 650))
      if (!alive()) return
      // 3. Соединение: подписи уходят, части встают на места с пружинкой — фигурка цельная.
      const fade = [...lines.current, ...dots.current, ...names.current, ...notes.current].map((n) => go(n, [{}, { opacity: 0 }], { duration: 280, easing: "ease-in" }))
      await Promise.all([...fade, ...parts.current.map((p, i) => go(p, [{ transform: apart(i) }, { transform: home }], { duration: 620, delay: (PARTS[i].id === "body" ? 0 : 40 + i * 25), easing: "cubic-bezier(.34,1.56,.64,1)" }))])
      if (!alive()) return
      // 4. Разворот лицом к камере.
      await go(group.current, [{ transform: START }, { transform: END }], { duration: 780, easing: "cubic-bezier(.65,0,.35,1)" })
      if (!alive()) return
      // 5. Присел, подпрыгнул, приземлился с пружинкой — около секунды.
      const jump: Keyframe[] = [
        { transform: "translateY(0) scale(1,1)", offset: 0, easing: "cubic-bezier(.3,0,.5,1)" },
        { transform: "translateY(0) scale(1.08,.8)", offset: 0.2, easing: "cubic-bezier(.2,.9,.3,1)" },
        { transform: "translateY(-86px) scale(.95,1.08)", offset: 0.48, easing: "cubic-bezier(.3,0,.4,1)" },
        { transform: "translateY(-92px) scale(1,1)", offset: 0.56, easing: "cubic-bezier(.5,0,.9,.5)" },
        { transform: "translateY(0) scale(1.07,.86)", offset: 0.8, easing: "cubic-bezier(.2,.8,.3,1)" },
        { transform: "translateY(-10px) scale(.98,1.03)", offset: 0.91, easing: "ease-in-out" },
        { transform: "translateY(0) scale(1,1)", offset: 1 },
      ]
      const shade: Keyframe[] = [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.1)", opacity: 1, offset: 0.2 }, { transform: "scale(.62)", opacity: 0.45, offset: 0.56 }, { transform: "scale(1.08)", opacity: 1, offset: 0.8 }, { transform: "scale(1)", opacity: 1 }]
      await Promise.all([go(bounce.current, jump, { duration: 1000 }), go(shadow.current, shade, { duration: 1000 })])
      if (!alive()) return
      // 6. Камера: в центр окна и крупнее.
      await go(cam.current, [{ transform: IDENT }, { transform: ZOOM }], { duration: 900, easing: "cubic-bezier(.22,1,.36,1)" })
      if (!alive()) return
      // 7. Самолётик Telegram: справа налево по синусоиде за корпусом, из-за левого края — к ногам, спереди (владелец: «код приходит вместе с Telegram»).
      await go(plane.current, planeFrames(), { duration: 2600, easing: "linear" })
      if (alive()) state = "done"
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { if (state !== "pre") pre(); return }
      if (e.intersectionRatio >= 0.45 && state === "pre") void play()
    }, { threshold: [0, 0.45] })
    pre()
    io.observe(el)
    return () => { io.disconnect(); run++; stop() }
  }, [words])

  return (
    <div data-block="fg010" ref={outer} role="img" aria-label={title} className="relative w-full overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-[#0e1320]" style={{ height: H * k }}>
      <div data-block="fg011" ref={stage} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <div data-block="fg021" ref={cam} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: 1100, perspectiveOrigin: `${ORIGIN.x}px ${ORIGIN.y - 40}px`, transform: ZOOM, transformOrigin: `${FOCUS.x}px ${FOCUS.y}px` }}>
        <div data-block="fg012" style={{ position: "absolute", left: ORIGIN.x, top: ORIGIN.y, transformStyle: "preserve-3d" }}>
          <div data-block="fg013" ref={group} style={{ position: "absolute", transformStyle: "preserve-3d", transform: END }}>
            <Floor shadowRef={(n) => { shadow.current = n }} />
            <div data-block="fg014" ref={bounce} style={{ position: "absolute", transformStyle: "preserve-3d", transformOrigin: `0px ${FEET_Y}px` }}>
              {PARTS.map((p, i) => (
                <div data-block="fg015" key={p.id} style={{ position: "absolute", transformStyle: "preserve-3d", transform: `${t3(p.pos)} rotateZ(${p.rotZ ?? 0}deg)` }}>
                  <div data-block="fg016" ref={(n) => { parts.current[i] = n }} style={{ position: "absolute", transformStyle: "preserve-3d" }}>
                    <Cuboid size={p.size} dark={p.dark} anchors={words.filter((w) => w.target === p.id).map((w) => ({ key: `${p.id}:${w.k}`, at: w.at, set: setAnchor }))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div data-block="fg022" ref={plane} style={{ position: "absolute", transformStyle: "preserve-3d", transform: PLANE_REST }}>
            <PaperPlane />
          </div>
        </div>
        </div>
        <svg data-block="fg017" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {words.map((w, i) => (
            <g key={w.k}>
              <polyline ref={(n) => { lines.current[i] = n }} fill="none" stroke="#e2e8f0" strokeOpacity={0.8} strokeWidth={1} style={{ opacity: 0 }} />
              <circle ref={(n) => { dots.current[i] = n }} r={3} fill="#e2e8f0" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }} />
            </g>
          ))}
        </svg>
        {words.map((w, i) => (
          <div data-block="fg018" key={w.k} style={{ position: "absolute", left: LABEL_X, top: LABEL_Y[i], fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#e2e8f0" }}>
            <div data-block="fg019" ref={(n) => { names.current[i] = n }} style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", opacity: 0, whiteSpace: "pre" }}>{`${w.k}  ${w.name}`}</div>
            <div data-block="fg020" ref={(n) => { notes.current[i] = n }} style={{ marginTop: 5, fontSize: 11.5, opacity: 0, whiteSpace: "nowrap" }}>{w.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
