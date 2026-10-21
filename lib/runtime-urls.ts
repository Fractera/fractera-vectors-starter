"use client";

// Client-side service URL derivation for the Shell app, based on the host the
// browser is actually on. Mirrors bridges/app/lib/runtime-urls.ts. We do NOT
// read NEXT_PUBLIC_* here: those are baked at build time and stay empty/stale
// across the IP→domain (Secure mode) switch, which has no app rebuild. Deriving
// from window.location works in both modes with one build.
//
// - IP / localhost (insecure mode): same host, service-specific ports.
// - Domain (Secure mode): sibling subdomains on 443, no ports. Building
//   `<host>:3001` on a domain yields https://admin.<domain>:3001 →
//   ERR_SSL_PROTOCOL_ERROR (3001 has no TLS).

// Помощники живут в `lib/site-urls.ts` — модуле БЕЗ `"use client"`, потому что
// они нужны и серверу тоже. Держать здесь вторую копию значит однажды починить
// одну и забыть другую.
import { isIpHost, apexFrom } from "./site-urls";

// Public base URL of the Auth service as the BROWSER must reach it.
export function authBase(): string {
  // 🔒 СЕРВЕРНАЯ ВЕТКА КЛИЕНТСКОГО МОДУЛЯ (257-6). Реестр `WEB4-ITEMS-REGISTRY/web4-items.json`
  // здесь не читается намеренно: файл с "use client" уезжает в браузер, а с ним
  // уехал бы и `node:fs`. Адрес приходит переменной, которую пишет установщик,
  // взяв её из того же реестра — производное, а не вторая копия.
  // 🛑 Пусто лучше неверного: умолчание `localhost:3001` — порт серверной линии,
  // и на узле оно означало бы стук в пустоту, который человек читает как ответ.
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_AUTH_URL ?? "";
  const { protocol, hostname } = window.location;
  if (isIpHost(hostname)) return `${protocol}//${hostname}:3001`;
  return `${protocol}//auth.${apexFrom(hostname)}`;
}

// Public base URL of the Admin/Bridges service as the BROWSER must reach it.
export function adminBase(): string {
  if (typeof window === "undefined") return "http://localhost:3002";
  const { protocol, hostname } = window.location;
  if (isIpHost(hostname)) return `${protocol}//${hostname}:3002`;
  return `${protocol}//admin.${apexFrom(hostname)}`;
}

// 🪦 `chatBase()` УБРАН 2026-09-05 (ревизия, шаг 116) вместе со ссылкой на чат в подвале.
// Служба `:3600` жива, но перестала быть путём к агенту, и её адрес больше никто не считает.

// Адрес ТЕРМИНАЛА агента в браузере (шаг 117): IP → <host>:3600/terminal, домен →
// chat.<apex>/terminal. Считается ровно как `adminBase()` — из адреса окна, а не из
// `NEXT_PUBLIC_*`: те запекаются на сборке и пустеют при переходе IP → домен.
//
// 🪦 РАСЧЁТ ВЕРНУЛСЯ ЧЕРЕЗ ДЕНЬ ПОСЛЕ СВОЕГО НАДГРОБИЯ, И ИМЯ У НЕГО ДРУГОЕ НЕ СЛУЧАЙНО.
// Убран был `chatBase()` — «адрес чата вообще», повод поставить ссылку на чат куда угодно.
// Здесь считается адрес ОДНОЙ страницы, у которой одно назначение: вход в подписку Claude
// Code. Верни мы общее имя — вернулся бы и повод, ради устранения которого его убирали.
export function agentTerminalUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3600/terminal";
  const { protocol, hostname } = window.location;
  if (isIpHost(hostname)) return `${protocol}//${hostname}:3600/terminal`;
  return `${protocol}//chat.${apexFrom(hostname)}/terminal`;
}

// Public base URL of the Projects service (fractera-projects :3003, step 197) — the automations
// layer that moved out of this slot into its own process. IP → <host>:3003 ; domain → projects.<apex>.
export function projectsBase(): string {
  if (typeof window === "undefined") return "http://localhost:3003";
  const { protocol, hostname } = window.location;
  if (isIpHost(hostname)) return `${protocol}//${hostname}:3003`;
  return `${protocol}//projects.${apexFrom(hostname)}`;
}

// Public base URL of the Design service (fractera-design :3004, step 197) — the future design-system
// surface on its own process. IP → <host>:3004 ; domain → design.<apex>.
export function designBase(): string {
  if (typeof window === "undefined") return "http://localhost:3004";
  const { protocol, hostname } = window.location;
  if (isIpHost(hostname)) return `${protocol}//${hostname}:3004`;
  return `${protocol}//design.${apexFrom(hostname)}`;
}

// Build the auth redirect for an unauthorized click on a protected destination.
// `requireRole` lets the auth form know whether the target needs architect (Start
// Coding → admin panel) or just any authenticated user (Dashboard).
//
// 🔒 ВЕДЁТ НА ВХОД, А НЕ НА РЕГИСТРАЦИЮ (260-4). Слово владельца 2026-09-21: «почему
// при первом входе меня кидают на регистрацию а не на логин?». Уже зарегистрированный
// человек, попав на регистрацию, заводил вторую запись. Форма входа сама отправит на
// регистрацию, когда пользователей ещё нет (первый станет архитектором), и сама
// подскажет «впервые здесь?» устройству, с которого ещё не входили.
export function signInRedirectUrl(callbackUrl: string, requireRole: "user" | "architect"): string {
  // 🔒 328-3: СОБСТВЕННЫЙ ДОМЕН ЭЛЕМЕНТА — ВХОД ЧЕРЕЗ ЦЕНТР УЗЛА. `auth.<этот домен>` не существует, а кука центра сюда
  // не дойдёт; поэтому центр (`NEXT_PUBLIC_AUTH_URL` — адрес службы входа узла) выдаёт одноразовый код, и он возвращается
  // в дверь этого сайта `/api/auth/callback` вместе с путём страницы. Своя зона узла и машина — прежний путь ниже.
  const center = process.env.NEXT_PUBLIC_AUTH_URL?.trim();
  if (typeof window !== "undefined" && center) {
    const centerZone = new URL(center).hostname.replace(/^auth\./, "");
    const here = window.location.hostname;
    if (!isIpHost(here) && here !== centerZone && !here.endsWith(`.${centerZone}`)) {
      let next = "/";
      try {
        const u = new URL(callbackUrl, window.location.origin);
        u.searchParams.set("signed-in", "1");
        next = `${u.pathname}${u.search}`;
      } catch { /* не адрес — главная */ }
      const ret = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
      return `${center}/api/auth/sso?return=${encodeURIComponent(ret)}&requireRole=${requireRole}`;
    }
  }
  // 328 (долг): на машине узла (localhost, голый IP) `authBase()` строит `<хост>:3001` — порт серверной линии, а служба входа
  // узла стоит на своём порту из реестра. Здесь ссылка ведёт на собственный `/login` сайта: прокси элемента знает и вход
  // подключённого домена, и порт службы из реестра (AUTH_FORM_PATHS) — порт в браузере не угадывается.
  const onMachine = typeof window !== "undefined" && isIpHost(window.location.hostname);
  const url = new URL(`${onMachine ? window.location.origin : authBase()}/login`);
  // Метка `signed-in` — та же, что ставит прокси (260-3): вернувшись, человек увидит
  // плашку «вы вошли» и на этом пути тоже.
  let back = callbackUrl;
  try { const u = new URL(callbackUrl); u.searchParams.set("signed-in", "1"); back = u.toString(); } catch { /* не адрес — отдаём как есть */ }
  url.searchParams.set("callbackUrl", back);
  url.searchParams.set("requireRole", requireRole);
  return url.toString();
}

// `adminUrlFromSite()` переехала в `lib/site-urls.ts`: её вызывает СЕРВЕРНЫЙ
// компонент главной, а отсюда, из-под `"use client"`, серверу её брать нельзя.
