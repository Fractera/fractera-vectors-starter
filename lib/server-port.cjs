// ПОРТ WEB4 — ОДНО МЕСТО, ГДЕ ОН ВЫБИРАЕТСЯ, И ОДИН ФАЙЛ, ГДЕ ОН ОБЪЯВЛЕН.
//
// ── Почему не 3000. Решение владельца 2026-09-18. Порт 3000 — самый занятый
// порт в мире разработки: Next, React, Rails, добрая половина учебных проектов.
// Отобрать занятый порт нельзя — кто встал первым, тот и держит; но мы встаём
// ПЕРВЫМИ, автозапуском при включении компьютера, ещё до того, как человек сел
// работать. Значит на 3000 ломались бы не мы, а его собственные проекты — с
// невнятной ошибкой, которую он никогда не свяжет с установкой WEB4.
//
// ── Почему не 50505 и вообще не 49152+. Измерено 2026-09-18:
// `netsh int ipv4 show dynamicport tcp` → Start 49152, Number 16384. Весь
// диапазон 49152–65535 операционная система раздаёт ИСХОДЯЩИМ соединениям
// (Windows и macOS; Linux берёт 32768–60999). Постоянный слушатель там однажды
// не поднимется, потому что его номер занят чьим-то временным соединением, —
// редко, невоспроизводимо и дорого в поиске.
//
// ── Отсюда блок ниже 32768. Зона 1024–32767 свободна от эфемерных диапазонов ВСЕХ трёх систем.
// 🪦 Блок 24680–24699 (20 портов) расширен шагом 370 (владелец 2026-10-01: «каждая версия предполагает безлимитное количество
// сайтов внутри себя … ограничено только вычислительной мощностью вашего компьютера» → «расширь блок портов»): порт нужен каждой
// ЗАПУЩЕННОЙ службе узла (ядро, элементы, их сторожа не в счёт), а 20 портов давали ядру и шести встроенным элементам лишь 13 своих.
// Теперь 24680–25679 (1000 портов). Ядро по-прежнему 24680; порты работающих элементов не меняются.
// 🔒 ПРОПУСК — ПОРТЫ ЧУЖИХ ПРОГРАММ ЧЕЛОВЕКА (закон 232: мы встаём первыми при загрузке и сломали бы их, как 3000). Источники, 2026-10-01:
//   реестр IANA (iana.org/assignments/service-names-port-numbers): 24754 cslg, 24922 find, 25000–25009 icl-twobase1…10,
//   25100 db2c-tls, 25576 sauterdongle, 25604 idtp;
//   Synergy / Barrier / Input Leap — `kDefaultPort = 24800` в их исходниках (protocol_types.h);
//   Minecraft — server-port 25565, rcon.port 25575 (таблица server.properties).
// 24680 сам зарегистрирован в IANA (tcc-http), но занят ядром с шага 232 у всех узлов — не переносится.

const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')

const PORT_BLOCK_START = 24680
const PORT_BLOCK_END = 25679
const PORT_SKIP = new Set([24754, 24800, 24922, 25000, 25001, 25002, 25003, 25004, 25005, 25006, 25007, 25008, 25009, 25100, 25565, 25575, 25576, 25604])

/** Порты блока, которые узел вправе занимать, по возрастанию (без пропускаемых). Один источник для ядра, установщика, предпросмотра
 *  и сторожа реестра. */
function blockPorts() {
  const out = []
  for (let p = PORT_BLOCK_START; p <= PORT_BLOCK_END; p += 1) if (!PORT_SKIP.has(p)) out.push(p)
  return out
}

/** Вправе ли узел занимать этот порт: внутри блока и не в списке пропуска. */
function isBlockPort(port) {
  return Number.isInteger(port) && port >= PORT_BLOCK_START && port <= PORT_BLOCK_END && !PORT_SKIP.has(port)
}

// Куда сервер кладёт номер порта, на котором в итоге встал. Файл нужен не
// человеку, а нашим же программам: сторож здоровья и команда «статус» обязаны
// спрашивать САМ СЕРВЕР, а не повторять предположение о порте. Предположение
// разойдётся с правдой ровно в тот день, когда порт уступили.
const RUNTIME_FILE = path.join(__dirname, '..', 'logs', 'runtime.json')

// Свободен ли порт. Спрашиваем единственным честным способом — пробуем встать.
// `exclusive: true` отключает поблажку, с которой две программы могут слушать
// один порт на разных стеках и обе считать себя единственными.
//
// 🛑 «НЕТ ТАКОГО СТЕКА» — НЕ «ПОРТ ЗАНЯТ» (шаг 369; найдено установкой в облачной машине без IPv6, 2026-10-01). Проба `::1` там
// падает с EAFNOSUPPORT/EADDRNOTAVAIL; ответ `false` делал занятым КАЖДЫЙ порт блока, и элементы не ставились вовсе. Такая ошибка
// теперь бросается: установщик и предпросмотр элемента ловят её при пробе `::1` как «второй стек здесь не нужен» (их `catch` до этого
// был мёртвым). `pickPort` ядра зовёт с `localhost` (без IPv6 — это 127.0.0.1) и её не встретит; при явном `HOST=::1` на машине
// без IPv6 честная ошибка лучше ложного «весь блок занят».
function isFree(port, hostname) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', (err) => {
      if (err && (err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL')) reject(err)
      else resolve(false)
    })
    probe.once('listening', () => probe.close(() => resolve(true)))
    probe.listen({ port, host: hostname, exclusive: true })
  })
}

// 🔒 ПОРЯДОК ВЫБОРА, И В НЁМ ЕСТЬ ОДНА ЖЁСТКОСТЬ. Явный PORT из окружения —
// приказ человека: он либо исполняется, либо служба честно не встаёт. Уступать
// с него молча нельзя: человек, назвавший порт, ждёт сайт ИМЕННО там — чаще
// всего потому, что на него смотрит прокси или проброс из контейнера.
async function pickPort(hostname) {
  const asked = Number(process.env.PORT)

  if (Number.isInteger(asked) && asked > 0) {
    if (await isFree(asked, hostname)) return { port: asked, moved: false, asked }
    const error = new Error(
      `Порт ${asked} задан переменной PORT, но занят. Освободите его или уберите PORT — ` +
        `тогда WEB4 сам выберет свободный из ${PORT_BLOCK_START}–${PORT_BLOCK_END}.`,
    )
    error.code = 'PORT_BUSY'
    throw error
  }

  for (const port of blockPorts()) {
    if (await isFree(port, hostname)) {
      return { port, moved: port !== PORT_BLOCK_START, asked: null }
    }
  }

  const error = new Error(
    `Свободного порта нет во всём блоке ${PORT_BLOCK_START}–${PORT_BLOCK_END}. ` +
      'Похоже, запущено много копий WEB4: остановите лишние (npm run serve:stop).',
  )
  error.code = 'PORT_BLOCK_FULL'
  throw error
}

function writeRuntime(data) {
  try {
    fs.mkdirSync(path.dirname(RUNTIME_FILE), { recursive: true })
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(data, null, 2))
  } catch {
    // Не встал файл — это неприятно, но не повод не отдавать страницы. Сторож
    // тогда возьмёт порт по умолчанию и скажет об этом вслух.
  }
}

function readRuntime() {
  try {
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'))
  } catch {
    return null
  }
}

module.exports = {
  PORT_BLOCK_START,
  PORT_BLOCK_END,
  PORT_SKIP,
  blockPorts,
  isBlockPort,
  RUNTIME_FILE,
  isFree,
  pickPort,
  writeRuntime,
  readRuntime,
}
