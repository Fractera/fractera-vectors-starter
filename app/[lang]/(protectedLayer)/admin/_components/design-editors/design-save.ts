// ЗАПИСЬ СВОЕГО ОФОРМЛЕНИЯ (579-1). Редакторы пишут через дверь этого
// элемента `/<язык>/admin/api/settings/design` пишет его `DESIGN-CONFIG` и перерисовывает страницы. Тело то же: заплата
// JSON Merge Patch, `null` стирает.
import { saveDesignPatch } from './settings-access'

export async function saveDesign({ patch }: { patch: Record<string, unknown> }): Promise<{ ok: boolean }> {
  const r = await saveDesignPatch(patch)
  return { ok: r.access === 'ok' && r.config !== null }
}
