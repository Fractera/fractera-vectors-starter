// @api serve a settings image slot at one stable address
import { NextResponse } from "next/server";
import { configImagePair, defaultSlotImage, type ImageSlot } from "@/lib/config-images";
import { getAppConfig } from "@/config/app-config";
import { iconSource, type LogoIconSize, parseLogoIconSlot } from "@/lib/logo-icons";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import sharp from "sharp";

// `icon-<size>` (node step 413): a square PNG cut from the element's own logo for the page head and the manifest
// (`lib/logo-icons.ts`). No logo, or the picture cannot be read → 307 to the shipped icon of that size, so the tab never
// stays empty. Read per request, like every setting: a new logo shows without a rebuild.
const SHIPPED: Record<LogoIconSize, (c: ReturnType<typeof getAppConfig>) => string | null | undefined> = {
  32: (c) => c.icons.icon32,
  48: (c) => c.icons.icon48,
  180: (c) => c.icons.appleTouch,
  192: (c) => c.icons.icon192,
  512: (c) => c.icons.icon512,
};

async function logoBytes(request: Request, logo: string): Promise<Buffer | null> {
  // A file of this element's `public/` is read from disk; an uploaded one (`/api/media/...`) through the same origin.
  if (logo.startsWith("/") && !logo.startsWith("/api/")) {
    const root = join(process.cwd(), "public");
    const file = normalize(join(root, logo));
    if (!file.startsWith(root)) return null;
    try { return await readFile(file); } catch { /* not a public file — try the origin */ }
  }
  try {
    const res = await fetch(new URL(logo, request.url), { cache: "no-store" });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function logoIcon(request: Request, size: LogoIconSize): Promise<Response> {
  const cfg = getAppConfig();
  const shipped = SHIPPED[size](cfg);
  const fallback = () =>
    shipped
      ? new NextResponse(null, { status: 307, headers: { Location: shipped, "Cache-Control": "no-store" } })
      : new NextResponse("No icon", { status: 404 });
  const source = iconSource(cfg);
  if (cfg.iconSet || !source) return fallback();
  const src = await logoBytes(request, source);
  if (!src) return fallback();
  try {
    // The apple-touch size gets a white field: iOS draws a transparent icon on black.
    const clear = { r: 0, g: 0, b: 0, alpha: 0 };
    const pad = Math.round(size * (size === 180 ? 0.08 : 0.04));
    const inner = await sharp(src, { density: 384 }).resize(size - pad * 2, size - pad * 2, { fit: "contain", background: clear }).png().toBuffer();
    const png = await sharp({ create: { width: size, height: size, channels: 4, background: size === 180 ? "#ffffff" : clear } })
      .composite([{ input: inner, gravity: "center" }]).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
  } catch {
    return fallback();
  }
}

// Картинка слота настроек ПО СТАБИЛЬНОМУ АДРЕСУ.
//
// 🔒 ЗАЧЕМ ДВЕРЬ, ЕСЛИ ЕСТЬ `ConfigImage`. Границы ошибок Next — `error.tsx` и
// `global-error.tsx` — ОБЯЗАНЫ быть клиентскими компонентами, это требование
// фреймворка, а не наш выбор. Клиентский компонент не может прочитать настройки:
// они лежат файлом на диске сервера, и `fs` в браузере не существует. Пропсами
// их тоже не передать — эти компоненты рендерит сам Next, набор их свойств
// фиксирован (`error`, `reset`), и серверного родителя, который мог бы что-то
// передать, у них нет.
//
// Поэтому адрес делается статическим, а разрешение слота остаётся на сервере:
// страница пишет `<img src="/api/config-image/error500-light">`, а какой файл за
// этим стоит — решается здесь, при каждом запросе. Работает с выключенным
// JavaScript (это обычная картинка) и переживает смену настройки без пересборки.
//
// 🔒 ПОЧЕМУ ПЕРЕНАПРАВЛЕНИЕ, А НЕ ОТДАЧА БАЙТОВ. Файл может лежать в `public/`
// (заглушка) или в хранилище (`/api/media/<id>/file`, картинка владельца).
// Перенаправление одинаково работает с обоими и оставляет раздачу тому, чья это
// работа, — иначе пришлось бы вторым кодом читать диск и угадывать тип файла.

export const dynamic = "force-dynamic";

const SLOTS = new Set<ImageSlot>(["loading", "notFound", "error500", "homePage"]);

function parseSlot(raw: string): { slot: ImageSlot; tone: "light" | "dark" } | null {
  const at = raw.lastIndexOf("-");
  if (at < 1) return null;
  const slot = raw.slice(0, at) as ImageSlot;
  const tone = raw.slice(at + 1);
  if (!SLOTS.has(slot)) return null;
  if (tone !== "light" && tone !== "dark") return null;
  return { slot, tone };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  const { slot: raw } = await params;
  const iconSize = parseLogoIconSlot(raw);
  if (iconSize) return logoIcon(request, iconSize);
  const parsed = parseSlot(raw);
  if (!parsed) {
    return new NextResponse("Unknown image slot", { status: 404 });
  }

  const { slot, tone } = parsed;
  const pair = configImagePair(slot);

  // Порядок отступления: запрошенный тон → второй тон → умолчание шаблона.
  //
  // Последняя ступень существует ради страницы ошибки: она обязана показать
  // картинку даже когда файл настроек нечитаем — иначе экран «что-то пошло не
  // так» сам приезжает со сломанным изображением, и посетитель видит уже две
  // поломки вместо одной.
  const target =
    pair[tone] ??
    pair[tone === "light" ? "dark" : "light"] ??
    defaultSlotImage(slot, tone);

  if (!target) {
    return new NextResponse("Slot is empty", { status: 404 });
  }

  // 🔒 АДРЕС ОТНОСИТЕЛЬНЫЙ, И ЭТО НЕ СТИЛЬ (найдено живым запросом 2026-08-15).
  //
  // Здесь стоял `NextResponse.redirect(new URL(target, request.url))`, и на
  // живом домене он выдавал `https://localhost:3000/placeholders/...`:
  // приложение стоит за nginx, поэтому ВНУТРИ него запрос выглядит пришедшим на
  // localhost. Сервер такой ответ принимает молча — а браузер посетителя идёт по
  // названному адресу и не находит ничего. Проверкой изнутри сервера дефект не
  // ловится вовсе: там localhost:3000 существует.
  //
  // Относительный `Location` разрешён (RFC 7231) и снимает вопрос целиком: браузер
  // достраивает его от адреса, по которому реально пришёл, — домен, схема и порт
  // всегда те, что видит человек.
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: target,
      // Настройка меняется без пересборки, поэтому ответ не кэшируется: иначе
      // владелец загрузил бы новую картинку и продолжал видеть прежнюю, не
      // понимая почему. Сам файл, на который ведёт перенаправление, кэшируется
      // своим обработчиком как обычно.
      "Cache-Control": "no-store",
    },
  });
}
