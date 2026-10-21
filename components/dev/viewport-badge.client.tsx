"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"

// Индикатор ширины экрана — только в режиме разработки.
//
// ЗАЧЕМ. Раскладка в проекте держится на брейкпоинтах и на общем пределе
// (`--app-w`, `--hero-w`), а глазами ширину не измерить: «кажется, около
// тысячи» — не тот ответ, по которому чинят вёрстку. Кружок называет и число, и
// текущую ступень, поэтому разговор о дизайне идёт числами, а не ощущениями.
//
// 🔒 ЕГО НЕТ В БОЕВОЙ СБОРКЕ, И ЭТО НЕ «СПРЯТАН», А ВЫРЕЗАН. Проверка
// `process.env.NODE_ENV` вычисляется на сборке: в продакшне тело функции
// становится `return null`, и вся разметка выпадает при минификации. Прятать
// такой значок классом было бы хуже вдвойне — он уехал бы к клиенту и однажды
// проявился на живом сайте.
//
// 🔒 `pointer-events-none` ОБЯЗАТЕЛЕН. Значок висит поверх угла страницы, где у
// сайтов обычно живут плавающие кнопки. Без этого он молча перехватывал бы клики
// по ним, и причину искали бы в самих кнопках.
//
// Угол ЛЕВЫЙ нижний (заказ владельца 2026-08-15): правый занят — там кнопки
// чата и «наверх», и значок закрывал бы именно их.

// 🔴 ВРЕМЕННО: ЗНАЧОК ПОКАЗЫВАЕТСЯ ВЕЗДЕ, ВКЛЮЧАЯ БОЕВУЮ СБОРКУ.
//
// Заказ владельца 2026-08-15: он смотрит сайт на реальном сервере, где сборка
// боевая, и проверки режима значок бы не пережил — то есть увидеть его было бы
// нельзя. Действует ДО ОТДЕЛЬНОГО СЛОВА «скрыть».
//
// 🔒 ВЕРНУТЬ ОДНИМ ЗНАЧЕНИЕМ: поставить `false` — и восстановится правило
// «только в разработке», ради которого файл и написан. Флаг стоит здесь, а не
// растворён в условии, ровно затем, чтобы его нашли: временное, спрятанное в
// логике, перестаёт быть временным.
const ALWAYS_VISIBLE = true;

/** Ступени Tailwind — те же значения, что у утилит `sm:`, `md:`, … */
const STEPS: [number, string][] = [
  [1536, "2xl"],
  [1280, "xl"],
  [1024, "lg"],
  [768, "md"],
  [640, "sm"],
];

function stepName(width: number): string {
  for (const [min, name] of STEPS) if (width >= min) return name;
  return "xs";
}

// 333-4 (слово владельца): «раздели этот элемент на две части поровну и в нижней части напиши название дизайна … название навыка
// максимум 10 букв потом … мелким шрифтом design skill»; «кнопку закрыть, который перепрописывает собственный CONFIG»,
// закрывает «только архитектор». Имя навыка приходит пропсом из макета (паспорт `designSkill`), кнопка появляется только
// после ответа `/api/me` с ролью architect; круг по-прежнему пропускает клики сквозь себя, кроме самой кнопки.
const SKILL_MAX = 10;

function shortName(name: string): string {
  return name.length > SKILL_MAX ? `${name.slice(0, SKILL_MAX)}…` : name;
}

export function ViewportBadge({ skill, closeLabel }: { skill: string | null; closeLabel: string }) {
  const [width, setWidth] = useState<number | null>(null);
  const [architect, setArchitect] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const read = () => setWidth(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { roles?: string[] } | null) => { if (alive) setArchitect(!!me?.roles?.includes("architect")); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  async function close() {
    const r = await fetch("/api/settings/platform", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ viewportBadge: false }),
    }).catch(() => null);
    if (r?.ok) setClosed(true);
  }

  if (!ALWAYS_VISIBLE && process.env.NODE_ENV === "production") return null;
  // До первого замера ничего не рисуем: подставить сюда серверное число нельзя —
  // на сервере ширины экрана не существует, и любое значение было бы выдумкой,
  // которая мигнёт при гидратации.
  if (width === null || closed) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 select-none">
      <div
        aria-hidden
        className="flex size-20 flex-col overflow-hidden rounded-full border border-white/30 bg-white/30 text-black shadow-lg backdrop-blur-sm"
      >
        <div className="flex flex-1 flex-col items-center justify-end pb-1">
          <span className="font-mono text-sm font-bold leading-none tabular-nums">{width}</span>
          <span className="mt-0.5 font-mono text-[10px] uppercase leading-none tracking-widest opacity-70">{stepName(width)}</span>
        </div>
        <div className="h-px w-full bg-black/30" />
        <div className="flex flex-1 flex-col items-center justify-start pt-1">
          {skill && <span className="font-mono text-[10px] font-bold leading-none">{shortName(skill)}</span>}
          <span className="mt-0.5 font-mono text-[7px] uppercase leading-none tracking-wider opacity-60">design skill</span>
        </div>
      </div>
      {architect && (
        <Button variant="bare" size="bare"
          type="button"
          onClick={close}
          aria-label={closeLabel}
          title={closeLabel}
          className="pointer-events-auto absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-black/20 bg-white text-[11px] font-bold leading-none text-black shadow"
        >
          ×
        </Button>
      )}
    </div>
  );
}
