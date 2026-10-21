# messenger-h2a — the H2A Messenger branch (node step 459)

Owner, 2026-10-12: «в правом выдвижном ящике для личного кабинета добавь две кнопки … H2H Messenger – H2A Messenger, Эти вкладки
доступны только при входе архитектора … мы создадим для них архитектурное решение внутри потока защищенных страниц … Внутри будет
динамическая маршрутизации которые последствия будет показывать и храхранить сообщения» and «жёстко требовать ограничения на
использование в дизайне ui/ux только библиотеке ai-elements».

What it is: the owner talks to their own agent. Entry: the button «H2A Messenger» in the account drawer (`lib/menu/account-links.ts`), above «The architect
group of pages»; only the role `architect` sees it.

| Path | Role |
|---|---|
| `layout.tsx` | the lock: `ARCHITECT_LAYER_ROLES` only |
| `page.tsx` | `/<lang>/messenger-h2a` — the list of conversations (`rootPage`, words in `_data/`, the window is the widget `widget-dynamic-messenger-h2a`) |
| `[...slug]/page.tsx` | `/<lang>/messenger-h2a/<conversation>` — one conversation, a dynamic route drawn on the first visit |
| `_components/` · `_libs/` · `_widgets/` | the branch's own components, logic and widgets (each with a README) |

🔒 **UI ONLY FROM AI-ELEMENTS.** Every visible part of the messenger — conversation, message, prompt input, attachments, tools — is
an ai-elements component from `components/ai-elements/` (install a missing one: `npx ai-elements@latest add <name>`, skill
`ai-elements`). No own chat primitives, no other chat library, no hand-made bubbles. The shared window is
`components/messenger/messenger-shell.client.tsx`.

**Not built yet (named):** sending, storing and loading messages; the agent
reading the conversation. No timers and no polling. Messages, when built, are stored in `<node>/data/services/<id>/messenger-h2a/`
(the element's data folder — it survives a rebuild), never inside the build.
