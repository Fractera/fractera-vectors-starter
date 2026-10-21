// Server-side derivation of the Auth service's browser-facing base URL, from the
// REQUEST host header. The mirror of authBase() in lib/runtime-urls.ts (which is
// client-side, from window.location). We do NOT read NEXT_PUBLIC_* here: those are
// baked at build time and go stale across the IP→domain (Secure mode) switch,
// which has no app rebuild. Deriving from the request host works in both modes
// with one build.
//
// - IP / localhost (insecure mode): same host, auth on port 3001.
// - Domain (Secure mode): the auth service is the sibling subdomain auth.<apex>
//   on 443 (no port). Building <host>:3001 on a domain would yield
//   https://admin.<domain>:3001 → ERR_SSL_PROTOCOL_ERROR (3001 has no TLS).

// Service subdomain prefixes — used to recover the apex from any service host
// (e.g. admin.aifa.dev → aifa.dev) in domain/Secure mode. Mirrors KNOWN_PREFIXES
// in lib/runtime-urls.ts.
// 285: `architect` — поддомен ядра (280-3); без него вход с `architect.<зона>` уходил на `auth.architect.<зона>`.
const KNOWN_PREFIXES = ["www", "auth", "admin", "architect", "projects", "design", "data", "hermes", "lightrag"];

function isIpHost(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname === "localhost";
}

function apexFrom(hostname: string): string {
  const labels = hostname.split(".");
  return KNOWN_PREFIXES.includes(labels[0]) ? labels.slice(1).join(".") : hostname;
}

// Адрес входа на подключённом домене — для запроса, пришедшего на имя в его зоне.
// Любое другое имя (петля, временный адрес туннеля) получает `null`, и решение
// принимают прежние ветки. Формула одна — `lib/domain/public-auth.cjs`.
export function publicAuthBaseFor(host: string | null): string | null {
  if (!host) return null;
  const p = publicAuth(process.cwd());
  if (!p) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname !== p.zone && !hostname.endsWith(`.${p.zone}`)) return null;
  return `https://${p.authHost}`;
}

/** Адрес входа на подключённом домене, независимо от того, откуда пришёл запрос. */
export function connectedDomainAuthBase(): string | null {
  const p = publicAuth(process.cwd());
  return p ? `https://${p.authHost}` : null;
}

// Build the Auth service base URL as the BROWSER must reach it, from a request's
// host header and protocol. `host` is the Host / X-Forwarded-Host value (may carry
// a :port in IP mode); `proto` is http or https (X-Forwarded-Proto). Falls back to
// the address from WEB4-ITEMS-REGISTRY/web4-items.json when host is missing (e.g. an internal
// request without a host) — no port is remembered here any more (step 257-6).
export function authBaseFromHost(host: string | null, proto: string): string {
  // 🔒 259-8: СВОЙ ДОМЕН ИМЕЕТ ПРИОРИТЕТ НАД РЕЕСТРОМ — для запроса С ЭТОГО ДОМЕНА.
  // Реестр знает адрес службы изнутри машины (`127.0.0.1:<порт>`); посетителю из
  // интернета этот адрес означает ЕГО СОБСТВЕННЫЙ компьютер. ✗ оплачено
  // 2026-09-21: «Войти» на `throughsongs.com` вела на `127.0.0.1:24681/register`.
  const publicBase = publicAuthBaseFor(host);
  if (publicBase) return publicBase;
  // 🔒 257-6: РЕЕСТР ИМЕЕТ ПРИОРИТЕТ НАД ИМЕНЕМ ХОСТА. На узле служба стоит на
  // назначенном порту из блока 24680-25679, и собрать её адрес из имени хоста
  // нельзя в принципе — получится `<host>:3001`, порт серверной линии, то есть
  // стук в пустоту. Реестра нет только на линии `aifa.dev`, и там работает
  // прежняя ветка ниже.
  const assigned = nodeAuthUrl();
  if (assigned) return assigned;
  if (!host) return "";
  const hostname = host.split(":")[0];
  const scheme = proto === "https" ? "https" : "http";
  // SERVER-LINE-ADDRESS: линия aifa.dev, реестра там нет, порт 3001 законен.
  if (isIpHost(hostname)) return `${scheme}://${hostname}:3001`;
  return `${scheme}://auth.${apexFrom(hostname)}`;
}

// Projects service base, the BROWSER-facing sibling of authBaseFromHost (step 211).
// The Projects layer (§3.12) left this slot in step 197 and runs in its own process
// (fractera-projects :3003 / projects.<apex>). The slot's proxy redirects any
// /projects* request here so the natural URL keeps working — IP mode: <host>:3003;
// Secure mode: projects.<apex> on 443. Mirror of projectsBase() in runtime-urls.ts.
export function projectsBaseFromHost(host: string | null, proto: string): string {
  if (!host) return "http://localhost:3003";
  const hostname = host.split(":")[0];
  const scheme = proto === "https" ? "https" : "http";
  if (isIpHost(hostname)) return `${scheme}://${hostname}:3003`;
  return `${scheme}://projects.${apexFrom(hostname)}`;
}import { authUrl as nodeAuthUrl } from "@/lib/microservices/urls";


import { publicAuth } from "@/lib/domain/public-auth.cjs";
