// @api redraw the pages of this element at once after a change
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/get-session";
import { withSiblingCors } from "@/lib/sibling-origin";

// ПЕРЕРИСОВАТЬ СТРАНИЦЫ СЕЙЧАС. Страницы элемента статические и обновляются раз в пять минут (первый заход после срока
// ещё старый); эта дверь помечает их устаревшими сразу, и следующий заход рисует новую версию. Страницы остаются
// статическими — дверь только сбрасывает их кэш.
//
// 🔒 КТО МОЖЕТ ЗВАТЬ (шаг 314-2), два пути и оба без ключа в адресе:
//   1. ключ `REVALIDATE_SECRET` в заголовке `Authorization: Bearer …` — так зовёт агент (`npm run pages:refresh`)
//      и службы узла;
//   2. сессия архитектора или администратора — так зовёт кнопка «Обновить» в Preview ядра (`architect.<зона>`), по куке
//      входа. Ответ ядру читается благодаря CORS своего источника (`lib/sibling-origin.ts`).
// Ни то ни другое — 401 (нет входа) или 403 (не та роль). Хозяин за этой машиной проходит как архитектор (get-session).
// 🛑 Ключ никогда не приходит в адресе: он осел бы в истории, журналах и `Referer`.

const SECRET = process.env.REVALIDATE_SECRET ?? "";
const ROLES = new Set(["architect", "admin"]);

async function allowed(req: NextRequest): Promise<200 | 401 | 403> {
  const auth = req.headers.get("authorization") ?? "";
  if (SECRET && auth === `Bearer ${SECRET}`) return 200;
  const session = await getSession(req);
  if (!session) return 401;
  return session.roles?.some((r) => ROLES.has(r)) ? 200 : 403;
}

export async function POST(req: NextRequest) {
  const status = await allowed(req);
  if (status !== 200) {
    return withSiblingCors(req, NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status }));
  }
  // Весь сайт: "/" — корень и файлы корня (manifest, robots, sitemap, llms.txt); "/[lang]" — все страницы на языках.
  revalidatePath("/", "layout");
  revalidatePath("/[lang]", "layout");
  return withSiblingCors(req, NextResponse.json({ ok: true, revalidated: ["/", "/[lang]"], ts: Date.now() }));
}
