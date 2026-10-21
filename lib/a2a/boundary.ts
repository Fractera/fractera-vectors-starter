import { readFileSync } from "node:fs"
import { join } from "node:path"
import { elementRoot } from "@/lib/page-tree"

// ГРАНИЦА УЗЛА ДЛЯ A2A (шаг узла 406). Видимость элемента — расширение визитки `visibility`: `network` — его визитку и конечную
// точку видят снаружи; `node` — только соседи по узлу. Элемент с видимостью `node` на запрос, пришедший через туннель
// Cloudflare, ведёт себя так, будто его нет (визитка — 404: A2A §3.3.2 «MUST NOT reveal the existence of resources the client
// is not authorized to access»; вызов — HTTP 403). Соседи зовут по петле машины (`127.0.0.1`/`localhost`) — их запрос не
// несёт заголовков туннеля.

/** Пришёл ли запрос извне узла: через туннель Cloudflare или на не-петлевой хост. */
export function fromOutside(headers: Headers): boolean {
  if (headers.get("cf-connecting-ip") || headers.get("cf-ray")) return true
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(":")[0].toLowerCase()
  return !(host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "::1")
}

/** Видимость элемента из его визитки; нет записи — `node` (закрыто по умолчанию). */
export function visibility(): "node" | "network" {
  // 417: видимость — поле паспорта OWN-SERVICE-PROPS/ (главная дверь элемента).
  try {
    const own = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ elementRoot(), "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"), "utf8"))
    if (own?.visibility === "network" || own?.visibility === "node") return own.visibility
  } catch { /* паспорта нет — закрыто */ }
  return "node"
}

/** Закрыт ли элемент для этого запроса. */
export function hiddenFrom(headers: Headers): boolean {
  return visibility() === "node" && fromOutside(headers)
}
