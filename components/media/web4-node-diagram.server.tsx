// СХЕМА WEB4-ЭЛЕМЕНТА — рисунок первого экрана страницы «WEB4 ядро» (2026-09-20).
//
// 🔒 ПОЧЕМУ РИСУНОК, А НЕ ФОТОГРАФИЯ ЭКРАНА. Решение владельца: «сгенерируй туда
// картинку, которая символизировала схематическое простое но понятное
// представление того, что это WEB4 элемент». Снимок интерфейса показал бы, КАК
// выглядит панель; здесь нужно показать, ЧТО такое узел, — а это отношения, а не
// вид. Отношения рисуются схемой.
//
// 🔒 SVG, А НЕ ФАЙЛ КАРТИНКИ, И ЭТО НЕ ВКУСОВЩИНА:
//   • цвета берутся из ТОКЕНОВ темы (`currentColor` и переменные), поэтому схема
//     сама переворачивается в тёмной теме — картинка потребовала бы двух файлов;
//   • вес — около двух килобайт против сотен у растра на первом экране, который
//     поисковик меряет секундомером;
//   • подписи остаются ТЕКСТОМ: их читает поиск, читает экранный диктор и можно
//     выделить мышью.
//
// 🔒 ПОДПИСИ ПРИХОДЯТ ПРОПСАМИ, А НЕ ВПИСАНЫ ЗДЕСЬ. Слова живут в языковой ячейке
// страницы — иначе схема говорила бы по-русски на английской версии сайта, и
// сторож словарей этого бы не увидел.

export type Web4NodeDiagramLabels = {
  /** Что в центре: сам узел. */
  core: string
  /** Четыре способности вокруг ядра. */
  ring: [string, string, string, string]
  /** Что происходит снаружи: соседние узлы сети. */
  peers: string
}

export function Web4NodeDiagram({
  labels,
  className,
}: {
  labels: Web4NodeDiagramLabels
  className?: string
}) {
  // Координаты четырёх узлов кольца. Считаны один раз и записаны числами: цикл
  // с тригонометрией здесь читался бы дольше, чем четыре пары чисел.
  const ring = [
    { x: 200, y: 96, label: labels.ring[0] },
    { x: 304, y: 200, label: labels.ring[1] },
    { x: 200, y: 304, label: labels.ring[2] },
    { x: 96, y: 200, label: labels.ring[3] },
  ]

  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={`${labels.core}: ${labels.ring.join(', ')}. ${labels.peers}`}
      className={className}
    >
      {/* Внешний контур — граница машины человека: всё внутри принадлежит ему. */}
      <circle
        cx="200"
        cy="200"
        r="168"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="1.5"
        strokeDasharray="6 8"
      />

      {/* Орбита, на которой стоят способности. */}
      <circle cx="200" cy="200" r="104" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />

      {/* Связи ядра со способностями: узел не набор частей, а целое. */}
      {ring.map(n => (
        <line
          key={`l-${n.x}-${n.y}`}
          x1="200"
          y1="200"
          x2={n.x}
          y2={n.y}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
      ))}

      {/* Соседи снаружи: узел виден сети и сам видит её. Полупрозрачные —
          они не его часть, а его собеседники. */}
      {[
        { x: 52, y: 78 },
        { x: 348, y: 78 },
        { x: 52, y: 322 },
        { x: 348, y: 322 },
      ].map(p => (
        <g key={`p-${p.x}-${p.y}`}>
          <line
            x1="200"
            y1="200"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
          <circle cx={p.x} cy={p.y} r="12" fill="currentColor" fillOpacity="0.07" />
          <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
        </g>
      ))}

      {/* Способности. */}
      {ring.map(n => (
        <g key={`n-${n.x}-${n.y}`}>
          <circle cx={n.x} cy={n.y} r="30" fill="var(--color-card, #fff)" />
          <circle cx={n.x} cy={n.y} r="30" fill="currentColor" fillOpacity="0.06" />
          <circle cx={n.x} cy={n.y} r="30" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            fillOpacity="0.75"
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Ядро. Заливка акцентом — это то, ради чего вся схема. */}
      <circle cx="200" cy="200" r="46" fill="var(--color-primary, currentColor)" fillOpacity="0.12" />
      <circle cx="200" cy="200" r="46" fill="none" stroke="var(--color-primary, currentColor)" strokeOpacity="0.55" strokeWidth="2" />
      <text
        x="200"
        y="205"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="currentColor"
      >
        {labels.core}
      </text>

      {/* Подпись внешнего круга — снизу, по центру, на самой линии границы. */}
      <text x="200" y="384" textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.5">
        {labels.peers}
      </text>
    </svg>
  )
}
