// THIS ELEMENT'S CALENDAR — every change of `data/cron.json` goes through here (core step 699).
//   npm run calendar -- list
//   npm run calendar -- add --event <id> --name "<name>" [--message "<words>"] --time HH:MM --repeat once|daily|weekdays|weekly|monthly|yearly
//                          --start YYYY-MM-DD [--until YYYY-MM-DD] [--id <id>]
//   npm run calendar -- pause <id> · resume <id> · cancel <id> · repeats off|on
//
// Why a command and not a hand edit (the owner of the node, 2026-11-08, after an entry «Сделать зарядку» was written by hand with
// `saidAt` at midnight and the core's canvas called its 07:30 of that day «missed» before the entry even existed): the pen is code —
// `saidAt` is the moment of the change, stamped here; the event must be one of this element's catalog (`OWN-SERVICE-PROPS/CRON.json`);
// the times and repeats are checked; the file is written whole through a temporary file, every other entry and key kept. The model names
// what and when; it never edits `data/cron.json` by hand. The server reads the file every minute — a change is live within a minute.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FILE = join(process.cwd(), 'data', 'cron.json')
const CATALOG = join(process.cwd(), 'OWN-SERVICE-PROPS', 'CRON.json')
const REPEATS = ['once', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly']
const [cmd, ...rest] = process.argv.slice(2)
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] ?? '' : null }
const fail = (msg) => { console.log(`===CALENDAR_FAIL=== ${msg}`); process.exit(1) }
const readJson = (f, fb) => { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return fb } }

const plan = readJson(FILE, null) ?? { repeatsPaused: false, schedules: [] }
if (!Array.isArray(plan.schedules)) plan.schedules = []
const save = () => {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(FILE + '.tmp', JSON.stringify(plan, null, 2) + '\n')
  renameSync(FILE + '.tmp', FILE)
}
const line = (s) => `${s.id} · ${s.start} ${s.time} · ${s.repeat}${s.until ? ` until ${s.until}` : ''}${s.enabled === false ? ' · paused' : ''} · ${s.event} · «${s.name ?? ''}»${s.saidAt ? ` · said ${s.saidAt}` : ''}`

if (cmd === 'list' || !cmd) {
  console.log(plan.schedules.length ? plan.schedules.map(line).join('\n') : 'no entries')
  if (plan.repeatsPaused) console.log('all repeating entries are paused (repeatsPaused)')
  process.exit(0)
}

if (cmd === 'add') {
  const events = (readJson(CATALOG, {})?.events ?? []).map((e) => e.id)
  const event = String(flag('--event') ?? '').trim()
  if (!events.includes(event)) fail(`--event: one of this element's catalog — ${events.join(', ') || 'none (OWN-SERVICE-PROPS/CRON.json)'}`)
  const name = String(flag('--name') ?? '').replace(/\s+/g, ' ').trim()
  if (!name) fail('--name "<what it is, in the element\'s default language>"')
  const time = String(flag('--time') ?? '')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fail('--time HH:MM, 24 hours')
  const repeat = String(flag('--repeat') ?? '')
  if (!REPEATS.includes(repeat)) fail(`--repeat: ${REPEATS.join(' · ')}`)
  const start = String(flag('--start') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start))) fail('--start YYYY-MM-DD (count «tomorrow», «in a week» from today on this computer)')
  const until = flag('--until')
  if (until !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(until) || until < start)) fail('--until YYYY-MM-DD, not before --start')
  const [y, mo, d] = start.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  if (repeat === 'once' && new Date(y, mo - 1, d, h, mi) <= new Date()) fail(`${start} ${time} has already passed on this computer`)
  const now = new Date()
  const RU = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
  const slug = [...name.toLowerCase()].map((c) => RU[c] ?? c).join('').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'entry'
  let id = String(flag('--id') ?? '').trim() || `${slug}-${start.replace(/-/g, '')}-${time.replace(':', '')}`
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) fail('--id: lower-case letters, digits and «-»')
  for (let i = 2; plan.schedules.some((s) => s.id === id); i++) id = `${id.replace(/-\d+$/, '')}-${i}`
  const message = flag('--message')
  const entry = { id, event, name, ...(message ? { message: message.trim() } : {}), saidAt: now.toISOString(), time, repeat, start, ...(until ? { until } : {}), enabled: true }
  plan.schedules.push(entry)
  save()
  console.log(`===CALENDAR_OK=== added ${line(entry)}`)
  process.exit(0)
}

if (['pause', 'resume', 'cancel'].includes(cmd)) {
  const id = rest[0]
  const s = plan.schedules.find((x) => x.id === id)
  if (!s) fail(`no entry «${id ?? ''}» — npm run calendar -- list`)
  if (cmd === 'cancel') plan.schedules = plan.schedules.filter((x) => x.id !== id)
  else s.enabled = cmd === 'resume'
  save()
  console.log(`===CALENDAR_OK=== ${cmd}d ${id}`)
  process.exit(0)
}

if (cmd === 'repeats') {
  const v = rest[0]
  if (!['on', 'off'].includes(v)) fail('repeats on|off')
  plan.repeatsPaused = v === 'off'
  save()
  console.log(`===CALENDAR_OK=== repeating entries ${v === 'off' ? 'paused' : 'on'}`)
  process.exit(0)
}

fail('list · add … · pause <id> · resume <id> · cancel <id> · repeats on|off')
