import type { Access, AccessWords } from './settings-access'

// Что показать вместо настроек, когда дверь их не отдала. Состояние названо словами — не пустым экраном.
export function AccessNotice({ access, words, loginHref }: { access: Access; words: AccessWords; loginHref?: string }) {
  if (access === 'ok') return null
  const text =
    access === 'loading' ? words.loading
    : access === 'signin' ? words.signin
    : access === 'forbidden' ? words.forbidden
    : access === 'unavailable' ? words.unavailable
    : words.error
  return (
    <div data-block="zsl0a" className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground" role="status">
      {text}{' '}
      {access === 'signin' && loginHref && (
        <a href={loginHref} className="font-medium text-primary hover:underline">{words.signinLink}</a>
      )}
    </div>
  )
}
