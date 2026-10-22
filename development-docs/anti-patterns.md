# Anti-patterns

Dead ends already paid for. One entry per cause: symptom · cause · cure. Newest on top.

| Symptom | Cause | Cure |
|---|---|---|
| The build stops on the shadcn guard `no-manual-dark` after minutes of work | a status colour written from the palette with a manual `dark:` pair (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`): a palette colour fits one theme and breaks the other | take a theme token that already knows both themes (`--primary`, `--accent`, `--destructive`, the `tone-*` tokens where the theme has them); before a long build run `npm run prebuild` alone — every guard in seconds |
| A search over the docs finds nothing, yet the record exists | the record was written in Russian: one word has six case forms, and a literal search matches one | write documents in English; the person's words only inside quotes |
