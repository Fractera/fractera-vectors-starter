import { referenceTitle } from "./words"

// Та же надпись для машин (markdown-копия страницы и llms-full.txt).
export function markdown(lang: string): string {
  return `# ${referenceTitle(lang)}\n`
}
