# messenger-h2a/_components

`index.ts` — the entry of the conversation route: `../[...slug]/page.tsx` only declares the segment and calls it. The route and
the window are shared by both messenger branches — `components/messenger/`. 🔒 Any chat UI is built only from ai-elements
(`components/ai-elements/`, skill `ai-elements`, gatekeeper `use-messenger`).
