// @api report liveness and which build of this application answers
import { NextRequest, NextResponse } from "next/server";

import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config";

// `ok`/`ts` говорят, что процесс жив СЕЙЧАС. Остальные поля говорят, КАКАЯ
// сборка отвечает и кто именно, — без них живой ответ не отличить от ответа
// сироты на порту, поднятой прошлой сессией.
//
// 🔒 ХЭШ БЕРЁТСЯ ИЗ ДВУХ ИСТОЧНИКОВ ПО ПОРЯДКУ, И ПОРЯДОК ВАЖЕН. `WEB4_COMMIT`
// кладёт `server.js` при старте — он читает живой `git rev-parse` и потому знает
// правду в режиме разработки. `NEXT_PUBLIC_GIT_COMMIT` задаёт сборка — он
// остаётся единственным источником там, где `.git` не доехал (человек скачал
// zip, установщик клонировал с `--depth 1`). Нет ни того ни другого — `null`,
// а не пустая строка: отсутствие сведения и сведение «пусто» — разные вещи.
// ✗ оплачено 232-2: маршрут читал только второй источник и отвечал
// `commit: null` на живом сервере, хотя хэш был известен процессу.
//
// `builtAt` — момент сборки, подставленный `next.config.ts` (см. `env` там).
// `langs` — включённый набор языков; источник тот же, из которого строятся
// маршруты, поэтому здесь читается `SUPPORTED_LANGUAGES`, а не env повторно:
// два разбора одной переменной разойдутся.
//
// 🔒 `force-dynamic` здесь ЗАКОНЕН и обязателен: это маршрут данных, а не
// страница публичного слоя. Застывший ответ о здоровье — прибор, который всегда
// показывает «жив»: `ts` и `pid` в нём остались бы от момента сборки.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 🛑 НАВЕДЁННЫЙ ОТКАЗ — ЕДИНСТВЕННЫЙ СПОСОБ ДОКАЗАТЬ, ЧТО СТОРОЖ РАБОТАЕТ.
  // Сторож (`scripts/health-watch.mjs`) ловит состояние «процесс жив, а страницы
  // не отдаются» — то самое, которое владелец видел 2026-09-18 и которого не
  // видит ни pm2, ни контейнер. Дождаться его случайно нельзя, поэтому он
  // наводится переменной. Читается она ВНУТРИ обработчика, а не при загрузке
  // модуля: иначе значение запеклось бы один раз, и снять отказ можно было бы
  // только перезапуском — то есть тем самым действием, которое мы проверяем.
  if (process.env.FRACTERA_HEALTH_FAIL === "1") {
    return NextResponse.json(
      { ok: false, reason: "FRACTERA_HEALTH_FAIL=1 — наведённый отказ для проверки сторожа" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    commit: process.env.WEB4_COMMIT || process.env.NEXT_PUBLIC_GIT_COMMIT || null,
    builtAt: process.env.NEXT_PUBLIC_BUILT_AT ?? null,
    startedAt: process.env.WEB4_STARTED_AT ?? null,
    // Порт и pid нужны не человеку, а разбору: по ним видно, ТОТ ли процесс
    // отвечает, который считает себя сервером, — и на том ли порту он стоит,
    // на котором его ищут.
    port: Number(process.env.PORT) || null,
    pid: process.pid,
    mode: process.env.NODE_ENV === "production" ? "production" : "dev",
    langs: SUPPORTED_LANGUAGES,

  });
}
