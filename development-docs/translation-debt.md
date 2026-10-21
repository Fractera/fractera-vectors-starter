# Translation debt — what is still in one language, and why

While the element is being built, texts are written in the default language only (skill `use-languages`). Every text a visitor
or the person sees that is left without its translations gets a line here **the same day**; the line is deleted by the same
change that adds the translation. Keep only what cannot be derived: `npm run check:i18n` already knows the dictionaries and the
enabled set — this file holds the promise (which languages the thing owes) and the person's decision to defer it.

Format, one line per debt, address first:

```
- `<path>` — <what is in one language> · owes: <enabled set | 82> · <why deferred, the person's word if any>
```

## Open debts

(none recorded yet)
