// СЛОВА ЭКРАНА «ПИСЬМО-КЛЮЧ (RESEND)» — рядом с самим экраном (266-2).
//
// 🔒 УСТРОЙСТВО ТО ЖЕ, ЧТО У ЭКРАНА GOOGLE, И ЭТО СЛОВО ВЛАДЕЛЬЦА: «абсолютно такой
// же с точки зрения смысла». Повторяется смысл, а не текст: у Resend другие
// ловушки, и их надо назвать до того, как человек в них попадёт.
//
// 🛑 НАЗВАНИЯ РАЗДЕЛОВ ПАНЕЛИ RESEND ВЗЯТЫ У ПЕРВОИСТОЧНИКА (resend.com/docs,
// 2026-09-22): Domains → Add Domain; записи DKIM, SPF и MX/CNAME; «часто
// подтверждается в течение 15 минут», распространение DNS — до 72 часов; права
// ключа `full_access` и `sending_access`. Урок того же дня: инструкция по ЧУЖОЙ
// панели стареет молча и проверяется у источника, а не по памяти.
//
// 🛑 ГЛАВНАЯ ЛОВУШКА НАЗЫВАЕТСЯ НА ВТОРОЙ СТУПЕНИ, А НЕ В КОНЦЕ: пока домен не
// подтверждён, Resend шлёт письма только на почту владельца аккаунта. Узнав это
// после настройки, человек решает, что сломан наш продукт.

export type DnsWords = {
  cfTitle: string
  cfLocked: string
  /** место узла не объявлено — оба способа закрыты */
  placeUnknown: string
  cfAutoTitle: string
  cfAutoText: string
  cfManualTitle: string
  cfManualText: string
  colType: string
  colName: string
  colContent: string
  colPriority: string
  addRow: string
  removeRow: string
  send: string
  sending: string
  outCreated: string
  outExists: string
  outConflict: string
  outFailed: string
  errRowIncomplete: string
  errNoZone: string
  errZoneNotVisible: string
  regTitle: string
  regLocked: string
  regText: string
  regPoints: string[]
}

export type ResendSetupWords = {
  loading: string

  lockedTitle: string
  lockedText: string
  lockedWhere: string

  intro: string
  /** карточка лимитов (265-5): цифры — у первоисточника, ссылка ведёт туда же */
  limitsTitle: string
  limitsText: string
  limitsMore: string

  step1Title: string
  step1Text: string
  openResend: string

  step2Title: string
  step2Text: string
  step2Points: string[]
  /** подсказка «какой домен добавить» — `{zone}` подставляется */
  zoneHint: string
  openDomains: string
  /** два аккордеона ступени 2 (266-4): куда вносятся записи DNS */
  dns: DnsWords

  step3Title: string
  step3Text: string
  step3Points: string[]

  step4Title: string
  step4Text: string
  keyLabel: string
  keyHint: string
  fromLabel: string
  fromHint: string
  /** пример отправителя — `{zone}` подставляется */
  fromExample: string
  /** строка примеров под полем адреса — {zone} подставляется */
  fromExamples: string
  nameLabel: string
  nameHint: string
  nameExample: string
  turnOn: string
  sending: string

  step5Title: string
  onText: string
  offText: string
  /** «письма уходят с адреса …» — `{from}` подставляется */
  fromNow: string
  turnOff: string
  notInstalled: string

  savedOn: string
  savedOff: string

  errBoth: string
  errWhitespace: string
  errFromShape: string
  errFromSandbox: string
  errTemporary: string
  errForbidden: string
  errNetwork: string
  errUnknown: string

  caveat: string
}

const DICT: Record<string, ResendSetupWords> = {
  en: {
    loading: "Asking the node…",

    lockedTitle: "Your own domain comes first",
    lockedText:
      "The letter carries a link back to your sign-in page, and a node reachable only from this computer has no public page to link to. Resend also sends from your own domain only after it is verified. Set the domain up first — otherwise this screen would end in a button that sends nothing anyone can use.",
    lockedWhere: "The section «Domain and hosting» walks through it.",

    intro:
      "About ten minutes of your time in Resend, and then a wait while the internet learns your new records. The free plan is enough to start.",
    limitsTitle: "Free, within limits.",
    limitsText: "Every letter is load on Resend, as with any provider, so the free plan is capped: 3,000 emails a month, no more than 100 a day, up to 3 domains. One sign-in is one letter.",
    limitsMore: "Details at Resend →",

    step1Title: "Create a Resend account",
    step1Text: "Resend is the service that actually delivers the letter. Sign up with any email you read — the account is yours, not ours.",
    openResend: "Open Resend",

    step2Title: "Add your domain and prove it is yours",
    step2Text:
      "In Resend open «Domains» → «Add Domain». Resend recommends a subdomain rather than the domain itself — it keeps sign-in mail separate from anything else you send.",
    step2Points: [
      "Choose the region closest to most of the people who will sign in.",
      "Resend shows a table of DNS records: DKIM (type TXT, name resend._domainkey), two CNAME records for sending, and an optional DMARC (TXT, _dmarc). Your set may differ — copy exactly what Resend shows. Where they go is in the two sections below.",
      "Verification often takes about fifteen minutes; DNS can take up to 72 hours to spread. Resend shows «Verified» when it is done.",
      "Until it says «Verified», Resend delivers letters only to the email of the Resend account owner — anyone else gets nothing. This is Resend's rule, not ours.",
    ],
    zoneHint: "Your domain is {zone} — a subdomain such as mail.{zone} is a good choice.",
    openDomains: "Open Domains in Resend",
    dns: {
      cfTitle: "Your domain lives in Cloudflare — the node adds the records",
      cfLocked: "Closed: this node is marked as a dedicated server, so you add the records at your registrar. Use the section below.",
      placeUnknown: "Both sections are closed: say on the architect home page where this node runs — your computer or a server.",
      cfAutoTitle: "The quick way — «Auto configure» in Resend",
      cfAutoText: "On the «DNS Records» step Resend shows «Auto configure» with the Cloudflare logo; it adds everything itself. It works only if in this same browser you are signed in to the Cloudflare account that holds the domain. Not signed in, or prefer to see each record — use the form.",
      cfManualTitle: "By hand — through this form",
      cfManualText: "In Resend press «Manual setup» and copy each row of its table: type, name and content. Leave TTL and Proxy status — the node sets «Auto» and «DNS only» itself. Empty rows are skipped.",
      colType: "Type",
      colName: "Name",
      colContent: "Content",
      colPriority: "Priority",
      addRow: "Add a row",
      removeRow: "Remove row",
      send: "Send records to Cloudflare",
      sending: "Sending…",
      outCreated: "added",
      outExists: "already there — skipped",
      outConflict: "another record with this name already exists — left untouched, check it in Cloudflare",
      outFailed: "Cloudflare refused",
      errRowIncomplete: "A filled row is missing its type, name or content.",
      errNoZone: "This node has no Cloudflare zone connected.",
      errZoneNotVisible: "The Cloudflare key does not see your zone any more.",
      regTitle: "Your domain lives with a registrar — you add the records",
      regLocked: "Closed: this node is marked as your own computer, so the section above adds the records through Cloudflare for you.",
      regText: "Open the panel of the company you bought the domain from, or wherever its DNS records live, and find the DNS section.",
      regPoints: [
        "Add each row of Resend's table: type, name and content, exactly as shown.",
        "If the records live in Cloudflare, switch proxying off for the CNAME rows («DNS only»).",
        "Come back to Resend and press «Verify» — it may take from minutes to hours.",
      ],
    },

    step3Title: "Create a key that can only send",
    step3Text: "In Resend open «API Keys» → create a key. Give it a name you will recognise later.",
    step3Points: [
      "Permission «Sending access» is enough: the key can send letters and nothing else. «Full access» would also let it delete your domains.",
      "You may restrict the key to the domain you just verified — then even a leaked key sends only from it.",
      "Resend shows the key once. Copy it before closing that page.",
    ],

    step4Title: "Bring the key and choose the sender",
    step4Text:
      "The key goes straight into your sign-in service and is never shown again. The sender is the address people see the letter come from; it must be on the domain you verified.",
    keyLabel: "API key",
    keyHint: "shown by Resend once — copy it before closing that page",
    fromLabel: "Sender address",
    fromHint: "on the domain you verified in Resend",
    fromExample: "noreply@{zone}",
    fromExamples: "For example noreply@{zone}, or login@{zone}, or hello@{zone}. If you added a subdomain in Resend, the address is on it: noreply@mail.{zone}.",
    nameLabel: "Sender name (optional)",
    nameHint: "What people see in their inbox instead of the bare address — your project's name, for example.",
    nameExample: "Sign-in",
    turnOn: "Turn sign-in letters on",
    sending: "Writing and restarting…",

    step5Title: "State",
    onText: "Sign-in letters are on. The option is on your sign-in page.",
    offText: "Sign-in letters are off. Nobody sees the option.",
    fromNow: "Letters are sent from {from}.",
    turnOff: "Turn off",
    notInstalled:
      "This node carries no sign-in service, so there is nothing to configure. Install it first — until then nobody can sign in at all.",

    savedOn: "Done. The service is restarting; the option appears within a few seconds.",
    savedOff: "Turned off. The sender stays remembered for next time.",

    errBoth: "Both are needed: without a sender the service would use its default, which no mail service accepts — and the option would appear anyway.",
    errWhitespace: "There is a space or a line break inside the key. That usually means the copy caught something extra.",
    errFromShape: "That does not look like an address. For example noreply@mail.example.com.",
    errFromSandbox: "Addresses on resend.dev deliver only to the owner of the Resend account, so your visitors would never get the letter. Use an address on your own verified domain.",
    errTemporary: "Keys cannot be set from a temporary address: anyone who was sent that link could open this page. Do it from this computer or from your own domain.",
    errForbidden: "This needs the architect role.",
    errNetwork: "The node did not answer. Nothing was written.",
    errUnknown: "The node refused and did not say why. Nothing was written.",

    caveat:
      "Whether the key works and the domain is verified is known only to Resend, at the first letter. The node checks the shape and does not pretend to check more.",
  },
  ru: {
    loading: "Спрашиваю узел…",

    lockedTitle: "Сначала собственный домен",
    lockedText:
      "В письме лежит ссылка обратно на вашу страницу входа, а у узла, доступного только с этого компьютера, публичной страницы нет. К тому же Resend отправляет с вашего домена только после того, как он подтверждён. Сначала подключите домен — иначе настройка закончится кнопкой, которая не шлёт ничего, чем можно воспользоваться.",
    lockedWhere: "Это разбирает раздел «Домен и хостинг».",

    intro:
      "Минут десять вашего времени в Resend, а потом ожидание, пока интернет узнает ваши новые записи. Бесплатного тарифа для начала достаточно.",
    limitsTitle: "Бесплатно — в пределах лимитов.",
    limitsText: "Каждое письмо — нагрузка на Resend, как у любого провайдера, поэтому бесплатный тариф ограничен: 3 000 писем в месяц, не больше 100 в день, до 3 доменов. Один вход — одно письмо.",
    limitsMore: "Подробнее у Resend →",

    step1Title: "Заведите аккаунт Resend",
    step1Text: "Resend — служба, которая на самом деле доставляет письмо. Зарегистрируйтесь с любой почтой, которую читаете; аккаунт ваш, а не наш.",
    openResend: "Открыть Resend",

    step2Title: "Добавьте свой домен и докажите, что он ваш",
    step2Text:
      "В Resend откройте «Domains» → «Add Domain». Resend советует поддомен, а не сам домен: так письма для входа не смешиваются со всем остальным, что вы отправляете.",
    step2Points: [
      "Выберите регион, ближайший к большинству тех, кто будет входить.",
      "Resend покажет таблицу записей DNS: DKIM (тип TXT, имя resend._domainkey), две записи CNAME для отправки и необязательную DMARC (TXT, _dmarc). Набор у вас может отличаться — переносите ровно то, что показал Resend. Куда их вносить — в двух разделах ниже.",
      "Подтверждение часто занимает около пятнадцати минут; расходиться по интернету записи DNS могут до 72 часов. Когда всё готово, Resend пишет «Verified».",
      "Пока там не написано «Verified», Resend доставляет письма только на почту владельца аккаунта Resend — всем остальным не приходит ничего. Это правило Resend, а не наше.",
    ],
    zoneHint: "Ваш домен — {zone}; хороший выбор — поддомен вида mail.{zone}.",
    openDomains: "Открыть Domains в Resend",
    dns: {
      cfTitle: "Домен живёт в Cloudflare — записи добавляет узел",
      cfLocked: "Закрыто: этот узел отмечен как выделенный сервер, поэтому записи вносите вы у регистратора. Воспользуйтесь разделом ниже.",
      placeUnknown: "Оба раздела закрыты: укажите на главной странице архитектора, где работает этот узел — на вашем компьютере или на сервере.",
      cfAutoTitle: "Быстрый путь — «Auto configure» в Resend",
      cfAutoText: "На шаге «DNS Records» Resend показывает кнопку «Auto configure» со значком Cloudflare — он добавит всё сам. Это работает, только если в этом же браузере вы вошли в тот аккаунт Cloudflare, где лежит домен. Не вошли или хотите видеть каждую запись — заполните форму.",
      cfManualTitle: "Вручную — через эту форму",
      cfManualText: "В Resend нажмите «Manual setup» и перенесите каждую строку его таблицы: тип, имя и значение. TTL и Proxy status переносить не нужно — узел сам ставит «Auto» и «DNS only». Пустые строки пропускаются.",
      colType: "Тип",
      colName: "Имя",
      colContent: "Значение",
      colPriority: "Приоритет",
      addRow: "Добавить строку",
      removeRow: "Убрать строку",
      send: "Отправить записи в Cloudflare",
      sending: "Отправляю…",
      outCreated: "добавлена",
      outExists: "уже была — пропущена",
      outConflict: "с этим именем уже есть другая запись — не тронута, проверьте её в Cloudflare",
      outFailed: "Cloudflare отказал",
      errRowIncomplete: "В заполненной строке не хватает типа, имени или значения.",
      errNoZone: "К этому узлу не подключена зона Cloudflare.",
      errZoneNotVisible: "Ключ Cloudflare больше не видит вашу зону.",
      regTitle: "Домен у регистратора — записи вносите вы",
      regLocked: "Закрыто: этот узел отмечен как ваш компьютер, поэтому записи за вас добавляет через Cloudflare раздел выше.",
      regText: "Откройте панель компании, у которой куплен домен, или ту, где живут его записи DNS, и найдите раздел DNS.",
      regPoints: [
        "Добавьте каждую строку таблицы Resend: тип, имя и значение — точно как показано.",
        "Если записи живут в Cloudflare, у строк CNAME выключите проксирование («DNS only»).",
        "Вернитесь в Resend и нажмите «Verify» — это может занять от минут до часов.",
      ],
    },

    step3Title: "Создайте ключ, который умеет только отправлять",
    step3Text: "В Resend откройте «API Keys» → создайте ключ. Дайте ему имя, которое потом узнаете.",
    step3Points: [
      "Права «Sending access» достаточно: такой ключ умеет отправлять письма и ничего больше. «Full access» позволил бы ему ещё и удалять ваши домены.",
      "Ключ можно ограничить только что подтверждённым доменом — тогда даже утёкший ключ отправит только с него.",
      "Resend показывает ключ один раз. Скопируйте его, прежде чем закрыть ту страницу.",
    ],

    step4Title: "Принесите ключ и выберите отправителя",
    step4Text:
      "Ключ уходит прямо в вашу службу входа и больше не показывается. Отправитель — адрес, с которого люди увидят письмо; он обязан быть на подтверждённом домене.",
    keyLabel: "Ключ API",
    keyHint: "Resend показывает его один раз — скопируйте, прежде чем закрыть ту страницу",
    fromLabel: "Адрес отправителя",
    fromHint: "на домене, который вы подтвердили в Resend",
    fromExample: "noreply@{zone}",
    fromExamples: "Например noreply@{zone}, или login@{zone}, или hello@{zone}. Если в Resend вы добавили поддомен, адрес на нём: noreply@mail.{zone}.",
    nameLabel: "Имя отправителя (необязательно)",
    nameHint: "Его люди видят в почте вместо голого адреса — например, название вашего проекта.",
    nameExample: "Вход",
    turnOn: "Включить вход по письму",
    sending: "Записываю и перезапускаю…",

    step5Title: "Состояние",
    onText: "Вход по письму включён. Этот способ стоит на вашей странице входа.",
    offText: "Вход по письму выключен. Этого способа никто не видит.",
    fromNow: "Письма уходят с адреса {from}.",
    turnOff: "Выключить",
    notInstalled:
      "На этом узле нет службы входа, и настраивать нечего. Сначала установите её — пока её нет, войти не может никто.",

    savedOn: "Готово. Служба перезапускается, способ появится через несколько секунд.",
    savedOff: "Выключено. Отправитель запомнен на следующий раз.",

    errBoth: "Нужно и то и другое: без отправителя служба взяла бы своё умолчание, которое не принимает ни одна почтовая служба, — а способ входа всё равно бы появился.",
    errWhitespace: "Внутри ключа пробел или перенос строки. Обычно это значит, что копирование захватило лишнее.",
    errFromShape: "Это не похоже на адрес. Например: noreply@mail.example.com.",
    errFromSandbox: "С адресов на resend.dev письма доходят только до владельца аккаунта Resend — ваши посетители их не получат. Возьмите адрес на своём подтверждённом домене.",
    errTemporary: "Ключ нельзя вписать с временного адреса: эту страницу мог бы открыть всякий, кому переслали ссылку. Сделайте это с самого компьютера или со своего домена.",
    errForbidden: "Для этого нужна роль архитектора.",
    errNetwork: "Узел не ответил. Ничего не записано.",
    errUnknown: "Узел отказал и не назвал причину. Ничего не записано.",

    caveat:
      "Работает ли ключ и подтверждён ли домен, знает только Resend — при первом письме. Узел проверяет форму и не притворяется, что умеет больше.",
  },
}

/** Адреса панели Resend — одни на все языки, поэтому вынесены из словаря. */
export const RESEND_URL = "https://resend.com/"
export const RESEND_DOMAINS_URL = "https://resend.com/domains"
/** Тариф Resend — первоисточник лимитов (проверено 2026-09-22). */
export const RESEND_PRICING_URL = "https://resend.com/pricing"

/** Слова экрана на выбранном языке; незнакомый язык честно деградирует до английского. */
export function resendSetupWords(lang: string): ResendSetupWords {
  return DICT[lang] ?? DICT.en
}
