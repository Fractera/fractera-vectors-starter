// ПЕРЕРИСОВАТЬ СТРАНИЦЫ СЕЙЧАС (node step 314-2). `npm run pages:refresh`
//
// Страницы элемента статические и обновляются раз в пять минут: первый заход после этого срока ещё показывает старую
// версию и запускает перерисовку, следующий — новую. Агент, закончивший правку текста, зовёт этот прибор, и правка видна
// сразу: он стучится в дверь элемента `POST /api/revalidate` на этой машине.
//
// 🔒 КЛЮЧ — В ЗАГОЛОВКЕ, А НЕ В АДРЕСЕ. `REVALIDATE_SECRET` берётся из окружения или `.env.local` и уходит заголовком
// `Authorization`. Ключ в строке адреса оседает в истории браузера, журналах и `Referer`; а статическая страница, читающая
// параметры адреса, перестала бы быть статической. `AUTH_SECRET` сюда не годится никогда: им подписываются сессии.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function envValue(name) {
  if (process.env[name]?.trim()) return process.env[name].trim()
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) return ''
  const m = readFileSync(file, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

const port = envValue('PORT') || '3000'
const secret = envValue('REVALIDATE_SECRET')
const url = `http://127.0.0.1:${port}/api/revalidate`

try {
  const r = await fetch(url, { method: 'POST', headers: secret ? { authorization: `Bearer ${secret}` } : {} })
  const body = await r.text()
  if (!r.ok) {
    console.error(`===PAGES_REFRESH_FAILED=== ${url} → ${r.status} ${body.slice(0, 200)}`)
    process.exit(1)
  }
  console.log(`===PAGES_REFRESH_OK=== ${url} → ${r.status}: страницы перерисуются при следующем заходе`)
} catch (e) {
  console.error(`===PAGES_REFRESH_FAILED=== ${url} не отвечает: ${e instanceof Error ? e.message : String(e)} — элемент запущен?`)
  process.exit(1)
}
