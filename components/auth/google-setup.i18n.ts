// СЛОВА ЭКРАНА «ВХОД ЧЕРЕЗ GOOGLE» — рядом с самим экраном (265-2, переписаны 265-4).
//
// 🔒 ПОЧЕМУ СЛОВА ЗДЕСЬ, А НЕ В `_data` СТРАНИЦЫ. `_data` несёт слова СТРАНИЦЫ.
// Экран переиспользуем: тот же вид понадобится соседнему разделу «Письмо-ключ
// (Resend)» и любому провайдеру, чьи ключи выдаёт кто-то чужой.
//
// 🛑 НАЗВАНИЯ РАЗДЕЛОВ КОНСОЛИ GOOGLE ВЗЯТЫ ИЗ ПЕРВОИСТОЧНИКА, А НЕ ПО ПАМЯТИ, И
// ЭТО ОПЛАЧЕНО ЗАМЕЧАНИЕМ ВЛАДЕЛЬЦА 2026-09-21: «из твоего описания я сделать это
// не могу». Первая редакция вела человека в «OAuth consent screen → Credentials»,
// а Google этот раздел переименовал: сегодня это **Google Auth Platform** с
// разделами **Branding**, **Audience** и **Clients**, и кнопка называется
// **CREATE CLIENT** (support.google.com/cloud/answer/6158849).
//
// 🔒 ОТСЮДА ПРАВИЛО ШИРЕ ЭТОГО ФАЙЛА: инструкция, ведущая человека по ЧУЖОЙ
// панели, стареет без нашего ведома и молча. Проверять её надо у первоисточника
// в тот день, когда её пишут, и заново — когда человек сообщает, что не нашёл.

export type GoogleSetupWords = {
  loading: string

  /** плашка: узел ещё не на своём домене */
  lockedTitle: string
  lockedText: string
  lockedWhere: string

  /** общая подводка над лестницей */
  intro: string
  /** карточка лимитов (265-5): цифры — у первоисточника, ссылка ведёт туда же */
  limitsTitle: string
  limitsText: string
  limitsMore: string

  step1Title: string
  step1Text: string
  openConsole: string
  /** маршрут по консоли точками — путь владельца, пройденный им 2026-09-22 (265-5) */
  step1Route: { title: string; text: string }[]
  routeHint: string
  watchVideo: string

  step2Title: string
  step2Text: string
  step2Points: string[]

  step3Title: string
  step3Text: string
  step3Points: string[]

  step4Title: string
  step4Text: string
  redirectLabel: string
  redirectRequired: string
  originLabel: string
  originOptional: string
  copy: string
  copied: string
  noRedirect: string

  step5Title: string
  step5Text: string
  idLabel: string
  idHint: string
  secretLabel: string
  secretHint: string
  turnOn: string
  sending: string

  step6Title: string
  onText: string
  offText: string
  turnOff: string
  notInstalled: string

  savedOn: string
  savedOff: string

  errBoth: string
  errShape: string
  errWhitespace: string
  errTemporary: string
  errForbidden: string
  errNetwork: string
  errUnknown: string

  caveat: string
}

const DICT: Record<string, GoogleSetupWords> = {
  en: {
    loading: "Asking the node…",

    lockedTitle: "Your own domain comes first",
    lockedText:
      "Google returns a person to a public address after they approve the sign-in, and a node that is reachable only from this computer has no such address. Set the domain up first — otherwise this screen would end in a button that looks configured and never works.",
    lockedWhere: "The section «Domain and hosting» walks through it, once, in about ten minutes of waiting.",

    intro:
      "Five minutes in Google's console, once. Nothing here costs money, and you do not need to publish anything to start.",
    limitsTitle: "Free, within limits.",
    limitsText: "Every sign-in is load on Google, as with any provider, so free use is capped: in «Testing» up to 100 test users; once published, Google limits how fast new users can be added, and the pace depends on your app's history.",
    limitsMore: "Details at Google →",

    step1Title: "Create a project in Google's console",
    step1Text:
      "A project is only a container for your keys — nobody but you sees its name. Open the console, use the project selector in the top bar and create a new one.",
    openConsole: "Open Google Cloud Console",
    step1Route: [
      { title: "View all APIs", text: "On the console's home page find the button «View all APIs»." },
      { title: "Credentials", text: "In the menu on the left choose «Credentials»." },
      { title: "Create a project", text: "Google asks for a project first. Create one and wait until the console takes you into it." },
      { title: "+ Create credentials", text: "In the top bar press «+ Create credentials»." },
      { title: "OAuth client ID", text: "Choose «OAuth client ID». Google may answer that the app has to be configured first — that is expected." },
      { title: "App information", text: "Google sign-in needs your app to have a name and a support email. Enter both." },
      { title: "Audience", text: "Choose «External» — any Google account can sign in, which is what a public site needs." },
      { title: "Contact information", text: "Your email again — this one is for Google itself." },
      { title: "Agree and create", text: "Accept the «Google API Services: User Data Policy» and press «Create». Sign-in can only be attached to an app that exists." },
      { title: "OAuth client ID, again", text: "Now go back to «+ Create credentials» → «OAuth client ID» once more; this time it opens the form." },
      { title: "Web application", text: "In the list «Application type» choose «Web application». Give it a name or keep the one Google suggests." },
      { title: "Two addresses", text: "First «Authorized JavaScript origins», below it «Authorized redirect URIs». Both values are in step 4 of this screen, ready to copy." },
      { title: "Copy the pair", text: "After «Create» a window opens with Client ID and Client secret, each with a copy button. Bring both to step 5 of this screen." },
      { title: "Check the list", text: "After saving, the new client appears in your project under the name you gave it." },
    ],
    routeHint: "Hover a number to read the action, or tap it to keep the text below.",
    watchVideo: "Watch it done on video (YouTube, in English)",

    step2Title: "Say what people will see while signing in",
    step2Text:
      "In the left menu open «Google Auth Platform» → «Branding». This is the screen a person is shown when they press your Google button, so the name here is your name, not ours.",
    step2Points: [
      "App name — what the person reads above «wants access to your Google Account».",
      "User support email — your own address; Google shows it to anyone who asks.",
      "Developer contact information — your address again, this one is for Google itself.",
    ],

    step3Title: "Decide who may sign in",
    step3Text:
      "Same menu, section «Audience». Choose user type «External» — that is any Google account, which is what a public site needs. Then one choice worth understanding:",
    step3Points: [
      "While the app stays in «Testing», only the accounts you list as test users can sign in — up to 100 — and their approval expires after seven days.",
      "Publishing removes both limits. Verification by Google is required only for sensitive scopes; sign-in asks for name, email and profile, which are not sensitive.",
      "So: add yourself as a test user to try it today, and publish when you want other people in.",
    ],

    step4Title: "Create the client and give Google your addresses",
    step4Text:
      "Same menu, section «Clients» → «CREATE CLIENT» → application type «Web application». The form asks for two kinds of address; both are below, ready to copy.",
    redirectLabel: "Authorized redirect URI",
    redirectRequired: "Required. This is where Google sends the person back. One extra character and sign-in ends with «redirect_uri_mismatch» on Google's side.",
    originLabel: "Authorized JavaScript origin",
    originOptional: "Optional for this kind of sign-in — Google's own documentation says server-side apps specify the redirect URI. The field is in the form, so the value is here; filling it changes nothing and leaving it empty breaks nothing.",
    copy: "Copy",
    copied: "Copied",
    noRedirect:
      "Your sign-in service has not been told its public address yet. Reconnect the domain — until then there is nothing to give Google.",

    step5Title: "Bring the pair Google gave you",
    step5Text:
      "After «CREATE» Google shows two values. They go straight into your sign-in service; the node does not keep them and cannot show them back.",
    idLabel: "Client ID",
    idHint: "ends with .apps.googleusercontent.com",
    secretLabel: "Client secret",
    secretHint: "shown by Google once — copy it before closing that page",
    turnOn: "Turn Google on",
    sending: "Writing and restarting…",

    step6Title: "State",
    onText: "Google sign-in is on. The button is on your sign-in page.",
    offText: "Google sign-in is off. Nobody sees the button.",
    turnOff: "Turn off",
    notInstalled:
      "This node carries no sign-in service, so there is nothing to configure. Install it first — until then nobody can sign in at all.",

    savedOn: "Done. The service is restarting; the button appears within a few seconds.",
    savedOff: "Turned off. The service is restarting.",

    errBoth: "Both values are needed: with one of them the service keeps the provider off, and the screen would lie to you.",
    errShape: "That client id does not look like Google's — they end with .apps.googleusercontent.com. Check you did not paste the secret into the first field.",
    errWhitespace: "There is a space or a line break inside the value. That usually means the copy caught something extra.",
    errTemporary: "Keys cannot be set from a temporary address: anyone who was sent that link could open this page. Do it from this computer or from your own domain.",
    errForbidden: "This needs the architect role.",
    errNetwork: "The node did not answer. Nothing was written.",
    errUnknown: "The node refused and did not say why. Nothing was written.",

    caveat:
      "Whether the pair is correct is known only to Google, and only at the first sign-in. The node checks the shape and does not pretend to check more.",
  },
  ru: {
    loading: "Спрашиваю узел…",

    lockedTitle: "Сначала собственный домен",
    lockedText:
      "После согласия человека Google возвращает его по публичному адресу, а у узла, доступного только с этого компьютера, такого адреса нет. Сначала подключите домен — иначе настройка закончится кнопкой, которая выглядит рабочей и не работает.",
    lockedWhere: "Это разбирает раздел «Домен и хостинг» — один раз, и почти всё время там уходит на ожидание.",

    intro:
      "Пять минут в консоли Google, один раз. Ничего из этого не стоит денег, и публиковать что-либо, чтобы начать, не нужно.",
    limitsTitle: "Бесплатно — в пределах лимитов.",
    limitsText: "Каждый вход — нагрузка на Google, как у любого провайдера, поэтому бесплатное использование ограничено: в режиме «Testing» — до 100 тестовых пользователей; после публикации Google ограничивает скорость прироста новых пользователей, и темп зависит от истории приложения.",
    limitsMore: "Подробнее у Google →",

    step1Title: "Создайте проект в консоли Google",
    step1Text:
      "Проект — это просто контейнер для ваших ключей, его имя не увидит никто, кроме вас. Откройте консоль, нажмите выбор проекта в верхней полосе и создайте новый.",
    openConsole: "Открыть Google Cloud Console",
    step1Route: [
      { title: "View all APIs", text: "На главной странице консоли найдите кнопку «View all APIs»." },
      { title: "Credentials", text: "В меню слева выберите «Credentials»." },
      { title: "Создайте проект", text: "Сначала Google попросит проект. Создайте его и дождитесь, пока консоль перебросит вас в его настройку." },
      { title: "+ Create credentials", text: "В верхней полосе нажмите «+ Create credentials»." },
      { title: "OAuth client ID", text: "Выберите «OAuth client ID». Google может ответить, что сначала нужно сконфигурировать приложение, — так и должно быть." },
      { title: "Сведения о приложении", text: "Вход через Google требует, чтобы у приложения было название и почта техподдержки. Впишите оба." },
      { title: "Аудитория", text: "Выберите «External» — внешняя аудитория: войти сможет любой аккаунт Google, это и нужно публичному сайту." },
      { title: "Контактная информация", text: "Снова ваша почта — эта нужна самому Google." },
      { title: "Согласие и создание", text: "Примите «Google API Services: User Data Policy» и нажмите «Create». Авторизацию можно добавить только к уже созданному приложению." },
      { title: "OAuth client ID ещё раз", text: "Теперь снова «+ Create credentials» → «OAuth client ID»; на этот раз откроется форма." },
      { title: "Web application", text: "В списке «Application type» выберите «Web application». Имя придумайте или оставьте то, что предложил Google." },
      { title: "Два адреса", text: "Сначала «Authorized JavaScript origins», под ним «Authorized redirect URIs». Оба значения — на ступени 4 этого экрана, готовые к копированию." },
      { title: "Скопируйте пару", text: "После «Create» откроется окно: вверху Client ID и Client secret, у каждого кнопка копирования. Принесите оба на ступень 5 этого экрана." },
      { title: "Проверьте список", text: "После сохранения в вашем проекте появится новый клиент с именем, которое вы дали или оставили." },
    ],
    routeHint: "Наведите на номер, чтобы прочитать действие, или нажмите — текст останется под линией.",
    watchVideo: "Посмотреть весь путь на видео (YouTube, на английском)",

    step2Title: "Скажите, что человек увидит при входе",
    step2Text:
      "В левом меню откройте «Google Auth Platform» → «Branding». Это тот экран, который показывают человеку, нажавшему вашу кнопку Google, — значит и имя здесь ваше, а не наше.",
    step2Points: [
      "App name — то, что человек прочитает над словами «хочет получить доступ к вашему аккаунту Google».",
      "User support email — ваш адрес; Google показывает его всякому, кто спросит.",
      "Developer contact information — снова ваш адрес, этот нужен самому Google.",
    ],

    step3Title: "Решите, кто может входить",
    step3Text:
      "То же меню, раздел «Audience». Тип пользователей — «External», то есть любой аккаунт Google: именно это нужно публичному сайту. Дальше один выбор, который стоит понимать:",
    step3Points: [
      "Пока приложение в состоянии «Testing», войти могут только те аккаунты, которые вы впишете в тестовые, — не больше ста, — и их согласие истекает через семь дней.",
      "Публикация снимает оба ограничения. Проверка со стороны Google нужна только для чувствительных разрешений, а вход просит имя, почту и профиль — они к чувствительным не относятся.",
      "Отсюда порядок: впишите себя в тестовые, чтобы попробовать сегодня, и опубликуйте, когда захотите пускать других.",
    ],

    step4Title: "Создайте клиент и отдайте Google свои адреса",
    step4Text:
      "То же меню, раздел «Clients» → «CREATE CLIENT» → тип приложения «Web application». Форма спросит два рода адресов; оба готовы ниже.",
    redirectLabel: "Authorized redirect URI",
    redirectRequired: "Обязательный. Сюда Google возвращает человека. Лишний знак — и вход закончится ошибкой «redirect_uri_mismatch» на стороне Google.",
    originLabel: "Authorized JavaScript origin",
    originOptional: "Для такого входа не обязателен: документация Google говорит, что серверные приложения указывают адрес возврата. Поле в форме есть, поэтому значение здесь — вписать его ничего не изменит, оставить пустым ничего не сломает.",
    copy: "Скопировать",
    copied: "Скопировано",
    noRedirect:
      "Вашей службе входа ещё не сказали её публичный адрес. Подключите домен заново — пока его нет, отдавать Google нечего.",

    step5Title: "Принесите пару, которую выдал Google",
    step5Text:
      "После «CREATE» Google покажет два значения. Они уходят прямо в вашу службу входа; узел их у себя не хранит и показать обратно не может.",
    idLabel: "Идентификатор клиента (Client ID)",
    idHint: "оканчивается на .apps.googleusercontent.com",
    secretLabel: "Секрет клиента (Client secret)",
    secretHint: "Google показывает его один раз — скопируйте, прежде чем закрыть ту страницу",
    turnOn: "Включить Google",
    sending: "Записываю и перезапускаю…",

    step6Title: "Состояние",
    onText: "Вход через Google включён. Кнопка стоит на вашей странице входа.",
    offText: "Вход через Google выключен. Кнопку никто не видит.",
    turnOff: "Выключить",
    notInstalled:
      "На этом узле нет службы входа, и настраивать нечего. Сначала установите её — пока её нет, войти не может никто.",

    savedOn: "Готово. Служба перезапускается, кнопка появится через несколько секунд.",
    savedOff: "Выключено. Служба перезапускается.",

    errBoth: "Нужны оба значения: с одним служба оставит провайдера выключенным, и экран соврал бы вам.",
    errShape: "Этот идентификатор не похож на выданный Google — они оканчиваются на .apps.googleusercontent.com. Проверьте, не вставили ли вы секрет в первое поле.",
    errWhitespace: "Внутри значения пробел или перенос строки. Обычно это значит, что копирование захватило лишнее.",
    errTemporary: "Ключи нельзя вписать с временного адреса: эту страницу мог бы открыть всякий, кому переслали ссылку. Сделайте это с самого компьютера или со своего домена.",
    errForbidden: "Для этого нужна роль архитектора.",
    errNetwork: "Узел не ответил. Ничего не записано.",
    errUnknown: "Узел отказал и не назвал причину. Ничего не записано.",

    caveat:
      "Верна ли пара, знает только Google, и только при первом входе. Узел проверяет форму и не притворяется, что умеет больше.",
  },
}

/** Адрес консоли Google — один на все языки, поэтому вынесен из словаря. */
export const GOOGLE_CONSOLE_URL = "https://console.cloud.google.com/"

/**
 * Видео, показывающее тот же путь глазами, — ВРЕМЕННО, до собственного ролика
 * (слово владельца 2026-09-22). Существование проверено ответом YouTube oEmbed:
 * «How to Get Google OAuth Client ID & Secret in 2026 (Step-by-Step for
 * Beginners)», канал Stack Seekers. Содержание агент не смотрел.
 */
export const GOOGLE_VIDEO_URL = "https://www.youtube.com/watch?v=bVNFEMPaU64"

/** Лимиты входа через Google — первоисточник (проверено 2026-09-22). */
export const GOOGLE_LIMITS_URL = "https://support.google.com/cloud/answer/9028764"

/** Слова экрана на выбранном языке; незнакомый язык честно деградирует до английского. */
export function googleSetupWords(lang: string): GoogleSetupWords {
  return DICT[lang] ?? DICT.en
}
