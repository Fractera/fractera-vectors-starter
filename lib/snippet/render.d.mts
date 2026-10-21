export const SNIPPET_WIDTH: number
export const SNIPPET_HEIGHT: number
export function designColors(root: string): Record<string, string>
export function renderSnippet(o: {
  title: string
  description?: string
  background?: string | null
  root: string
  colors?: Record<string, string> | null
}): Promise<Buffer>
export function patternSvg(seedText: string, colors: Record<string, string>): Buffer
