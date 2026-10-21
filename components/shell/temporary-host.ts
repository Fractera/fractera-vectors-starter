// Быстрый туннель Cloudflare: входа там нет, `/login` отвечает честным 404 (257-8).
// 🛑 Сверяется только ХВОСТ имени: адрес быстрого туннеля — случайные слова, меняется при каждом перезапуске.
// Единственное место этого знания: `lib/auth/temporary-address.ts` сайта берёт его отсюда (285-3).
export const TEMPORARY_SUFFIXES = [".trycloudflare.com"]

export function isTemporaryHostname(hostname: string): boolean {
  const bare = (hostname ?? "").trim().toLowerCase().replace(/:d+$/, "")
  return TEMPORARY_SUFFIXES.some((suffix) => bare.endsWith(suffix))
}
